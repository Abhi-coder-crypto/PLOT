import type { Express } from "express";
import bcrypt from "bcryptjs";
import {
  UserModel,
  LeadModel,
  ProjectModel,
  PlotModel,
  PaymentModel,
  ActivityLogModel,
  BuyerInterestModel,
  LeadInterestModel,
} from "./models";
import { authenticateToken, requireAdmin, generateToken, type AuthRequest } from "./middleware/auth";
import type { AuthResponse, DashboardStats, SalespersonStats } from "@shared/schema";
import {
  loginSchema,
  insertUserSchema,
  insertLeadSchema,
  assignLeadSchema,
  insertProjectSchema,
  insertPlotSchema,
  insertPaymentSchema,
  insertBuyerInterestSchema,
  insertLeadInterestSchema,
} from "@shared/schema";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";

export function registerRoutes(app: Express) {
  // ============= Authentication Routes =============
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { email, password } = validationResult.data;

      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({
        _id: String(user._id),
        email: user.email,
        role: user.role,
      });

      const response: AuthResponse = {
        token,
        user: {
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };

      res.json(response);
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ============= User Routes =============
  app.get("/api/users/salespersons", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const salespersons = await UserModel.find({ role: "salesperson" })
        .select("-password")
        .sort({ createdAt: -1 });
      res.json(salespersons);
    } catch (error: any) {
      console.error("Get salespersons error:", error);
      res.status(500).json({ message: "Failed to fetch salespersons" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { name, email, password, role, phone } = validationResult.data;

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
      });

      // Log activity
      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created User",
        entityType: "user",
        entityId: user._id,
        details: `Created ${role} account for ${name}`,
      });

      const userResponse = user.toObject();
      delete (userResponse as any).password;
      res.status(201).json(userResponse);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await UserModel.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============= Lead Routes =============
  app.get("/api/leads", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const query = authReq.user!.role === "admin" 
        ? {} 
        : { assignedTo: authReq.user!._id };

      const leads = await LeadModel.find(query)
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });
      res.json(leads);
    } catch (error: any) {
      console.error("Get leads error:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/today-followups", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const today = new Date();
      const startDate = startOfDay(today);
      const endDate = endOfDay(today);

      const query = authReq.user!.role === "admin"
        ? {
            followUpDate: {
              $gte: startDate,
              $lte: endDate,
            },
          }
        : {
            assignedTo: authReq.user!._id,
            followUpDate: {
              $gte: startDate,
              $lte: endDate,
            },
          };

      const leads = await LeadModel.find(query)
        .populate("assignedTo", "name email")
        .sort({ followUpDate: 1 });
      res.json(leads);
    } catch (error: any) {
      console.error("Get today followups error:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.post("/api/leads", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertLeadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { projectId, plotIds, highestOffer, ...leadData } = validationResult.data;
      const lead = await LeadModel.create(leadData);

      // If project and plots are selected, create a lead interest record
      if (projectId && plotIds && plotIds.length > 0) {
        await LeadInterestModel.create({
          leadId: lead._id,
          projectId,
          plotIds,
          highestOffer: highestOffer || 0,
          notes: `Initial interest from lead creation`,
        });
      }

      // Log activity
      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created Lead",
        entityType: "lead",
        entityId: lead._id,
        details: `Created lead for ${lead.name}${projectId ? ' with project interest' : ''}`,
      });

      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Create lead error:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id/assign", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validationResult = assignLeadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { salespersonId } = validationResult.data;
      const authReq = req as AuthRequest;

      const lead = await LeadModel.findByIdAndUpdate(
        req.params.id,
        {
          assignedTo: salespersonId,
          assignedBy: authReq.user!._id,
        },
        { new: true }
      );

      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // Log activity
      const salesperson = await UserModel.findById(salespersonId);
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Assigned Lead",
        entityType: "lead",
        entityId: lead._id,
        details: `Assigned lead ${lead.name} to ${salesperson?.name}`,
      });

      res.json(lead);
    } catch (error: any) {
      console.error("Assign lead error:", error);
      res.status(500).json({ message: "Failed to assign lead" });
    }
  });

  app.patch("/api/leads/:id", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertLeadSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const lead = await LeadModel.findByIdAndUpdate(
        req.params.id,
        validationResult.data,
        { new: true }
      );

      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Updated Lead",
        entityType: "lead",
        entityId: lead._id,
        details: `Updated lead ${lead.name}`,
      });

      res.json(lead);
    } catch (error: any) {
      console.error("Update lead error:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", authenticateToken, async (req, res) => {
    try {
      await LeadModel.findByIdAndDelete(req.params.id);
      res.json({ message: "Lead deleted successfully" });
    } catch (error: any) {
      console.error("Delete lead error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // ============= Lead Interest Routes =============
  app.get("/api/lead-interests", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      let interests;

      if (authReq.user!.role === "admin") {
        interests = await LeadInterestModel.find()
          .populate("leadId")
          .populate("projectId")
          .populate("plotIds")
          .sort({ createdAt: -1 });
      } else {
        const assignedLeads = await LeadModel.find({ assignedTo: authReq.user!._id });
        const leadIds = assignedLeads.map(lead => lead._id);
        interests = await LeadInterestModel.find({ leadId: { $in: leadIds } })
          .populate("leadId")
          .populate("projectId")
          .populate("plotIds")
          .sort({ createdAt: -1 });
      }

      res.json(interests);
    } catch (error: any) {
      console.error("Get lead interests error:", error);
      res.status(500).json({ message: "Failed to fetch lead interests" });
    }
  });

  app.get("/api/lead-interests/lead/:leadId", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      if (authReq.user!.role !== "admin") {
        const lead = await LeadModel.findOne({ 
          _id: req.params.leadId, 
          assignedTo: authReq.user!._id 
        });
        if (!lead) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const interests = await LeadInterestModel.find({ leadId: req.params.leadId })
        .populate("projectId")
        .populate("plotIds")
        .sort({ createdAt: -1 });
      res.json(interests);
    } catch (error: any) {
      console.error("Get lead interests by lead error:", error);
      res.status(500).json({ message: "Failed to fetch lead interests" });
    }
  });

  app.get("/api/lead-interests/plot/:plotId", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      let interests;

      if (authReq.user!.role === "admin") {
        interests = await LeadInterestModel.find({ plotIds: req.params.plotId })
          .populate("leadId")
          .populate("projectId")
          .sort({ createdAt: -1 });
      } else {
        const assignedLeads = await LeadModel.find({ assignedTo: authReq.user!._id });
        const leadIds = assignedLeads.map(lead => lead._id);
        interests = await LeadInterestModel.find({ 
          plotIds: req.params.plotId,
          leadId: { $in: leadIds }
        })
          .populate("leadId")
          .populate("projectId")
          .sort({ createdAt: -1 });
      }

      res.json(interests);
    } catch (error: any) {
      console.error("Get lead interests by plot error:", error);
      res.status(500).json({ message: "Failed to fetch lead interests" });
    }
  });

  app.post("/api/lead-interests", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertLeadInterestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { leadId, projectId, plotIds } = validationResult.data;

      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const authReq = req as AuthRequest;
      if (authReq.user!.role !== "admin" && String(lead.assignedTo) !== authReq.user!._id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const plots = await PlotModel.find({ _id: { $in: plotIds } });
      if (plots.length !== plotIds.length) {
        return res.status(404).json({ message: "One or more plots not found" });
      }

      const invalidPlots = plots.filter(plot => String(plot.projectId) !== projectId);
      if (invalidPlots.length > 0) {
        return res.status(400).json({ message: "All plots must belong to the specified project" });
      }

      const interest = await LeadInterestModel.create(validationResult.data);

      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Added Lead Interest",
        entityType: "lead",
        entityId: leadId,
        details: `Added interest for ${lead.name} in ${project.name}`,
      });

      const populatedInterest = await LeadInterestModel.findById(interest._id)
        .populate("leadId")
        .populate("projectId")
        .populate("plotIds");

      res.status(201).json(populatedInterest);
    } catch (error: any) {
      console.error("Create lead interest error:", error);
      res.status(500).json({ message: "Failed to create lead interest" });
    }
  });

  app.patch("/api/lead-interests/:id", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertLeadInterestSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const existingInterest = await LeadInterestModel.findById(req.params.id).populate("leadId");
      if (!existingInterest) {
        return res.status(404).json({ message: "Lead interest not found" });
      }

      const authReq = req as AuthRequest;
      const lead = existingInterest.leadId as any;
      if (authReq.user!.role !== "admin" && String(lead.assignedTo) !== authReq.user!._id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (validationResult.data.projectId) {
        if (authReq.user!.role !== "admin") {
          return res.status(403).json({ message: "Only admins can change project assignments" });
        }

        if (!validationResult.data.plotIds) {
          return res.status(400).json({ message: "plotIds must be provided when updating projectId" });
        }

        const project = await ProjectModel.findById(validationResult.data.projectId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
      }

      const finalProjectId = validationResult.data.projectId || existingInterest.projectId;

      if (validationResult.data.plotIds) {
        const plots = await PlotModel.find({ _id: { $in: validationResult.data.plotIds } });
        if (plots.length !== validationResult.data.plotIds.length) {
          return res.status(404).json({ message: "One or more plots not found" });
        }
        const invalidPlots = plots.filter(plot => String(plot.projectId) !== String(finalProjectId));
        if (invalidPlots.length > 0) {
          return res.status(400).json({ message: "All plots must belong to the specified project" });
        }
      }

      const interest = await LeadInterestModel.findByIdAndUpdate(
        req.params.id,
        validationResult.data,
        { new: true }
      ).populate("leadId").populate("projectId").populate("plotIds");

      res.json(interest);
    } catch (error: any) {
      console.error("Update lead interest error:", error);
      res.status(500).json({ message: "Failed to update lead interest" });
    }
  });

  app.delete("/api/lead-interests/:id", authenticateToken, async (req, res) => {
    try {
      const interest = await LeadInterestModel.findById(req.params.id).populate("leadId");
      if (!interest) {
        return res.status(404).json({ message: "Lead interest not found" });
      }

      const authReq = req as AuthRequest;
      const lead = interest.leadId as any;
      if (authReq.user!.role !== "admin" && String(lead.assignedTo) !== authReq.user!._id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await LeadInterestModel.findByIdAndDelete(req.params.id);
      res.json({ message: "Lead interest deleted successfully" });
    } catch (error: any) {
      console.error("Delete lead interest error:", error);
      res.status(500).json({ message: "Failed to delete lead interest" });
    }
  });

  // ============= Project Routes =============
  app.get("/api/projects", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      if (authReq.user!.role === "admin") {
        const projects = await ProjectModel.find().sort({ createdAt: -1 });
        return res.json(projects);
      }
      
      const assignedLeads = await LeadModel.find({ assignedTo: authReq.user!._id });
      const leadIds = assignedLeads.map(lead => String(lead._id));
      
      const assignedPayments = await PaymentModel.find({ leadId: { $in: leadIds } });
      const plotIds = assignedPayments.map(payment => payment.plotId);
      
      const assignedPlots = await PlotModel.find({ _id: { $in: plotIds } });
      const projectIds = Array.from(new Set(assignedPlots.map(plot => plot.projectId)));
      
      const projects = await ProjectModel.find({ _id: { $in: projectIds } }).sort({ createdAt: -1 });
      res.json(projects);
    } catch (error: any) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validationResult = insertProjectSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const project = await ProjectModel.create(validationResult.data);

      // Log activity
      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created Project",
        entityType: "plot",
        entityId: project._id,
        details: `Created project ${project.name}`,
      });

      res.status(201).json(project);
    } catch (error: any) {
      console.error("Create project error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // Get projects with plot and buyer interest overview
  app.get("/api/projects/overview", authenticateToken, async (req, res) => {
    try {
      const projects = await ProjectModel.find().sort({ createdAt: -1 });
      
      const projectsOverview = await Promise.all(
        projects.map(async (project) => {
          const projectId = String(project._id);
          
          // Get all plots for this project
          const plots = await PlotModel.find({ projectId }).sort({ plotNumber: 1 });
          
          // Get buyer interests for all plots in this project
          const plotIds = plots.map(p => String(p._id));
          const buyerInterests = await BuyerInterestModel.find({ 
            plotId: { $in: plotIds } 
          }).populate("salespersonId", "name email");
          
          // Calculate project-level stats
          const availablePlots = plots.filter(p => p.status === "Available").length;
          const bookedPlots = plots.filter(p => p.status === "Booked").length;
          const soldPlots = plots.filter(p => p.status === "Sold").length;
          const totalInterestedBuyers = buyerInterests.length;
          
          // Enrich plots with buyer interest data
          const enrichedPlots = plots.map(plot => {
            const plotId = String(plot._id);
            const plotInterests = buyerInterests.filter(bi => String(bi.plotId) === plotId);
            
            const interestCount = plotInterests.length;
            const highestOffer = plotInterests.length > 0 
              ? Math.max(...plotInterests.map(bi => bi.offeredPrice)) 
              : 0;
            
            // Get unique salespersons for this plot using Map for proper deduplication
            const salespersonsMap = new Map();
            plotInterests.forEach(bi => {
              const salespersonDoc = bi.salespersonId as any;
              const salespersonId = salespersonDoc?._id ? String(salespersonDoc._id) : String(bi.salespersonId);
              const salespersonName = salespersonDoc?.name || bi.salespersonName;
              
              if (!salespersonsMap.has(salespersonId)) {
                salespersonsMap.set(salespersonId, {
                  id: salespersonId,
                  name: salespersonName,
                });
              }
            });
            const salespersons = Array.from(salespersonsMap.values());
            
            return {
              ...plot.toObject(),
              buyerInterestCount: interestCount,
              highestOffer,
              salespersons,
              buyerInterests: plotInterests.map(bi => {
                const salespersonDoc = bi.salespersonId as any;
                const salespersonId = salespersonDoc?._id ? String(salespersonDoc._id) : String(bi.salespersonId);
                const salespersonName = salespersonDoc?.name || bi.salespersonName;
                
                return {
                  _id: String(bi._id),
                  buyerName: bi.buyerName,
                  buyerContact: bi.buyerContact,
                  buyerEmail: bi.buyerEmail,
                  offeredPrice: bi.offeredPrice,
                  salespersonId,
                  salespersonName,
                  notes: bi.notes,
                  createdAt: bi.createdAt,
                  updatedAt: bi.updatedAt,
                };
              }),
            };
          });
          
          return {
            ...project.toObject(),
            totalPlots: plots.length,
            availablePlots,
            bookedPlots,
            soldPlots,
            totalInterestedBuyers,
            plots: enrichedPlots,
          };
        })
      );
      
      res.json(projectsOverview);
    } catch (error: any) {
      console.error("Get projects overview error:", error);
      res.status(500).json({ message: "Failed to fetch projects overview" });
    }
  });

  // ============= Plot Routes =============
  app.get("/api/plots", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      
      if (authReq.user!.role === "admin") {
        const plots = await PlotModel.find().sort({ plotNumber: 1 });
        return res.json(plots);
      }
      
      const assignedLeads = await LeadModel.find({ assignedTo: authReq.user!._id });
      const leadIds = assignedLeads.map(lead => String(lead._id));
      
      const assignedPayments = await PaymentModel.find({ leadId: { $in: leadIds } });
      const plotIds = assignedPayments.map(payment => payment.plotId);
      
      const plots = await PlotModel.find({ _id: { $in: plotIds } }).sort({ plotNumber: 1 });
      res.json(plots);
    } catch (error: any) {
      console.error("Get plots error:", error);
      res.status(500).json({ message: "Failed to fetch plots" });
    }
  });

  app.post("/api/plots", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validationResult = insertPlotSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const plot = await PlotModel.create(validationResult.data);

      // Log activity
      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created Plot",
        entityType: "plot",
        entityId: plot._id,
        details: `Created plot ${plot.plotNumber}`,
      });

      res.status(201).json(plot);
    } catch (error: any) {
      console.error("Create plot error:", error);
      res.status(500).json({ message: "Failed to create plot" });
    }
  });

  // Get plots by category
  app.get("/api/plots/category/:category", authenticateToken, async (req, res) => {
    try {
      const { category } = req.params;
      const plots = await PlotModel.find({ category })
        .populate("projectId")
        .sort({ plotNumber: 1 });
      res.json(plots);
    } catch (error: any) {
      console.error("Get plots by category error:", error);
      res.status(500).json({ message: "Failed to fetch plots" });
    }
  });

  // Get plot statistics (interested buyers, offers)
  app.get("/api/plots/:id/stats", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const buyerInterests = await BuyerInterestModel.find({ plotId: id })
        .populate("salespersonId", "name email phone");
      
      const stats = {
        totalInterestedBuyers: buyerInterests.length,
        averageOfferedPrice: buyerInterests.length > 0 
          ? buyerInterests.reduce((sum, bi) => sum + bi.offeredPrice, 0) / buyerInterests.length 
          : 0,
        highestOffer: buyerInterests.length > 0 
          ? Math.max(...buyerInterests.map(bi => bi.offeredPrice)) 
          : 0,
        buyerInterests: buyerInterests,
      };
      
      res.json(stats);
    } catch (error: any) {
      console.error("Get plot stats error:", error);
      res.status(500).json({ message: "Failed to fetch plot statistics" });
    }
  });

  // ============= Buyer Interest Routes =============
  app.get("/api/buyer-interests/:plotId", authenticateToken, async (req, res) => {
    try {
      const { plotId } = req.params;
      const interests = await BuyerInterestModel.find({ plotId })
        .populate("salespersonId", "name email phone")
        .sort({ createdAt: -1 });
      res.json(interests);
    } catch (error: any) {
      console.error("Get buyer interests error:", error);
      res.status(500).json({ message: "Failed to fetch buyer interests" });
    }
  });

  app.post("/api/buyer-interests", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertBuyerInterestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { plotId, buyerName, buyerContact, buyerEmail, offeredPrice, salespersonId, notes } = validationResult.data;
      
      // Get salesperson name
      const salesperson = await UserModel.findById(salespersonId);
      if (!salesperson) {
        return res.status(404).json({ message: "Salesperson not found" });
      }

      const buyerInterest = await BuyerInterestModel.create({
        plotId,
        buyerName,
        buyerContact,
        buyerEmail,
        offeredPrice,
        salespersonId,
        salespersonName: salesperson.name,
        notes,
      });

      // Log activity
      const authReq = req as AuthRequest;
      const plot = await PlotModel.findById(plotId);
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Added Buyer Interest",
        entityType: "plot",
        entityId: plotId,
        details: `${buyerName} interested in plot ${plot?.plotNumber} with offer ₹${offeredPrice}`,
      });

      res.status(201).json(buyerInterest);
    } catch (error: any) {
      console.error("Create buyer interest error:", error);
      res.status(500).json({ message: "Failed to create buyer interest" });
    }
  });

  app.delete("/api/buyer-interests/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const buyerInterest = await BuyerInterestModel.findByIdAndDelete(id);
      
      if (!buyerInterest) {
        return res.status(404).json({ message: "Buyer interest not found" });
      }

      res.json({ message: "Buyer interest deleted successfully" });
    } catch (error: any) {
      console.error("Delete buyer interest error:", error);
      res.status(500).json({ message: "Failed to delete buyer interest" });
    }
  });

  // ============= Payment Routes =============
  app.post("/api/payments", authenticateToken, async (req, res) => {
    try {
      const validationResult = insertPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const { leadId, plotId, amount, mode, bookingType, transactionId, notes } = validationResult.data;

      // Create payment
      const payment = await PaymentModel.create({
        leadId,
        plotId,
        amount,
        mode,
        bookingType,
        transactionId,
        notes,
      });

      // Update plot status
      await PlotModel.findByIdAndUpdate(plotId, {
        status: bookingType === "Full" ? "Sold" : "Booked",
        bookedBy: leadId,
      });

      // Update lead status
      await LeadModel.findByIdAndUpdate(leadId, {
        status: "Booked",
      });

      // Log activity
      const authReq = req as AuthRequest;
      const lead = await LeadModel.findById(leadId);
      const plot = await PlotModel.findById(plotId);
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created Booking",
        entityType: "payment",
        entityId: payment._id,
        details: `Booked plot ${plot?.plotNumber} for ${lead?.name} - ₹${amount}`,
      });

      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Create payment error:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // ============= Activity Routes =============
  app.get("/api/activities", authenticateToken, async (req, res) => {
    try {
      const activities = await ActivityLogModel.find()
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(activities);
    } catch (error: any) {
      console.error("Get activities error:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // ============= Dashboard Routes =============
  app.get("/api/dashboard/admin", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const today = new Date();
      const startDate = startOfDay(today);
      const endDate = endOfDay(today);

      const [
        totalLeads,
        convertedLeads,
        lostLeads,
        unassignedLeads,
        totalProjects,
        totalPlots,
        availablePlots,
        bookedPlots,
        payments,
        todayFollowUps,
      ] = await Promise.all([
        LeadModel.countDocuments(),
        LeadModel.countDocuments({ status: "Booked" }),
        LeadModel.countDocuments({ status: "Lost" }),
        LeadModel.countDocuments({ assignedTo: { $exists: false } }),
        ProjectModel.countDocuments(),
        PlotModel.countDocuments(),
        PlotModel.countDocuments({ status: "Available" }),
        PlotModel.countDocuments({ status: { $in: ["Booked", "Sold"] } }),
        PaymentModel.find(),
        LeadModel.countDocuments({
          followUpDate: {
            $gte: startDate,
            $lte: endDate,
          },
        }),
      ]);

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      const stats: DashboardStats = {
        totalLeads,
        convertedLeads,
        lostLeads,
        unassignedLeads,
        totalProjects,
        totalPlots,
        availablePlots,
        bookedPlots,
        totalRevenue,
        todayFollowUps,
      };

      res.json(stats);
    } catch (error: any) {
      console.error("Get admin dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/salesperson", authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthRequest;
      const today = new Date();
      const startDate = startOfDay(today);
      const endDate = endOfDay(today);

      const [assignedLeads, todayFollowUps, convertedLeads, myLeads] = await Promise.all([
        LeadModel.countDocuments({ assignedTo: authReq.user!._id }),
        LeadModel.countDocuments({
          assignedTo: authReq.user!._id,
          followUpDate: {
            $gte: startDate,
            $lte: endDate,
          },
        }),
        LeadModel.countDocuments({
          assignedTo: authReq.user!._id,
          status: "Booked",
        }),
        LeadModel.find({
          assignedTo: authReq.user!._id,
          status: "Booked",
        }),
      ]);

      // Get payments for converted leads
      const leadIds = myLeads.map((lead) => lead._id);
      const payments = await PaymentModel.find({ leadId: { $in: leadIds } });
      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      const stats: SalespersonStats = {
        assignedLeads,
        todayFollowUps,
        convertedLeads,
        totalRevenue,
      };

      res.json(stats);
    } catch (error: any) {
      console.error("Get salesperson dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics Dashboard Endpoints
  app.get("/api/analytics/overview", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

      const [
        totalLeads,
        convertedLeads,
        totalSalespersons,
        totalRevenue,
        totalBuyerInterests,
        totalBookings,
        avgResponseTime,
      ] = await Promise.all([
        LeadModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        LeadModel.countDocuments({ status: "Booked", createdAt: { $gte: start, $lte: end } }),
        UserModel.countDocuments({ role: "salesperson" }),
        PaymentModel.aggregate([
          { $match: { createdAt: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]).then(result => result[0]?.total || 0),
        BuyerInterestModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        PaymentModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        LeadModel.aggregate([
          { 
            $match: { 
              createdAt: { $gte: start, $lte: end },
              firstContactDate: { $exists: true }
            } 
          },
          {
            $project: {
              responseTime: {
                $divide: [
                  { $subtract: ["$firstContactDate", "$createdAt"] },
                  1000 * 60 * 60 // Convert to hours
                ]
              }
            }
          },
          { $group: { _id: null, avgTime: { $avg: "$responseTime" } } }
        ]).then(result => Math.round(result[0]?.avgTime || 0))
      ]);

      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : "0.00";

      res.json({
        totalLeads,
        convertedLeads,
        conversionRate,
        totalSalespersons,
        totalRevenue,
        totalBuyerInterests,
        totalBookings,
        avgResponseTime,
        activeLeads: totalLeads - convertedLeads,
      });
    } catch (error: any) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/salesperson-performance", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

      const salespersons = await UserModel.find({ role: "salesperson" });
      
      const performanceData = await Promise.all(
        salespersons.map(async (salesperson) => {
          const [
            totalContacts,
            leadsAssigned,
            conversions,
            buyerInterestsAdded,
            lastActivity,
            revenue,
          ] = await Promise.all([
            ActivityLogModel.countDocuments({
              userId: salesperson._id,
              createdAt: { $gte: start, $lte: end },
            }),
            LeadModel.countDocuments({
              assignedTo: salesperson._id,
              createdAt: { $gte: start, $lte: end },
            }),
            LeadModel.countDocuments({
              assignedTo: salesperson._id,
              status: "Booked",
              updatedAt: { $gte: start, $lte: end },
            }),
            BuyerInterestModel.countDocuments({
              salespersonId: salesperson._id,
              createdAt: { $gte: start, $lte: end },
            }),
            ActivityLogModel.findOne({
              userId: salesperson._id,
            }).sort({ createdAt: -1 }),
            PaymentModel.aggregate([
              {
                $lookup: {
                  from: "leads",
                  localField: "leadId",
                  foreignField: "_id",
                  as: "lead",
                },
              },
              { $unwind: "$lead" },
              {
                $match: {
                  "lead.assignedTo": salesperson._id,
                  createdAt: { $gte: start, $lte: end },
                },
              },
              { $group: { _id: null, total: { $sum: "$amount" } } },
            ]).then(result => result[0]?.total || 0),
          ]);

          const conversionRate = leadsAssigned > 0 
            ? ((conversions / leadsAssigned) * 100).toFixed(2) 
            : "0.00";

          return {
            id: String(salesperson._id),
            name: salesperson.name,
            email: salesperson.email,
            totalContacts,
            leadsAssigned,
            conversions,
            conversionRate: parseFloat(conversionRate),
            buyerInterestsAdded,
            revenue,
            lastActivity: lastActivity?.createdAt || null,
            lastActivityDetails: lastActivity?.details || "No activity",
          };
        })
      );

      // Sort by conversion rate and revenue
      performanceData.sort((a, b) => b.revenue - a.revenue || b.conversionRate - a.conversionRate);

      res.json(performanceData);
    } catch (error: any) {
      console.error("Salesperson performance error:", error);
      res.status(500).json({ message: "Failed to fetch salesperson performance" });
    }
  });

  app.get("/api/analytics/daily-metrics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const numDays = parseInt(days as string);
      const endDate = endOfDay(new Date());
      const startDate = startOfDay(new Date(endDate.getTime() - (numDays * 24 * 60 * 60 * 1000)));

      const dailyData = [];
      
      for (let i = 0; i < numDays; i++) {
        const dayStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000) - 1);

        const [leadsCreated, conversions, buyerInterests, bookings] = await Promise.all([
          LeadModel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
          LeadModel.countDocuments({ 
            status: "Booked", 
            updatedAt: { $gte: dayStart, $lte: dayEnd } 
          }),
          BuyerInterestModel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
          PaymentModel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        ]);

        dailyData.push({
          date: dayStart.toISOString().split('T')[0],
          leadsCreated,
          conversions,
          buyerInterests,
          bookings,
        });
      }

      res.json(dailyData);
    } catch (error: any) {
      console.error("Daily metrics error:", error);
      res.status(500).json({ message: "Failed to fetch daily metrics" });
    }
  });

  app.get("/api/analytics/monthly-metrics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { months = 12 } = req.query;
      const numMonths = parseInt(months as string);
      const monthlyData = [];

      for (let i = numMonths - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const [leadsCreated, conversions, revenue] = await Promise.all([
          LeadModel.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
          LeadModel.countDocuments({ 
            status: "Booked", 
            updatedAt: { $gte: monthStart, $lte: monthEnd } 
          }),
          PaymentModel.aggregate([
            { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]).then(result => result[0]?.total || 0),
        ]);

        monthlyData.push({
          month: format(monthStart, 'MMM yyyy'),
          leadsCreated,
          conversions,
          revenue,
        });
      }

      res.json(monthlyData);
    } catch (error: any) {
      console.error("Monthly metrics error:", error);
      res.status(500).json({ message: "Failed to fetch monthly metrics" });
    }
  });

  app.get("/api/analytics/activity-timeline", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { limit = 50, salespersonId } = req.query;
      
      const query: any = {};
      if (salespersonId) {
        query.userId = salespersonId;
      }

      const activities = await ActivityLogModel.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .populate("userId", "name email");

      const formattedActivities = activities.map(activity => ({
        id: String(activity._id),
        userName: activity.userName,
        action: activity.action,
        entityType: activity.entityType,
        details: activity.details,
        createdAt: activity.createdAt,
        userDetails: (activity.userId as any)?.name || activity.userName,
      }));

      res.json(formattedActivities);
    } catch (error: any) {
      console.error("Activity timeline error:", error);
      res.status(500).json({ message: "Failed to fetch activity timeline" });
    }
  });

  app.get("/api/analytics/lead-source-analysis", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : startOfMonth(new Date());
      const end = endDate ? new Date(endDate as string) : endOfDay(new Date());

      const leadSourceData = await LeadModel.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { 
          $group: { 
            _id: "$source", 
            count: { $sum: 1 },
            conversions: {
              $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] }
            }
          } 
        },
        { $sort: { count: -1 } },
      ]);

      const formattedData = leadSourceData.map(item => ({
        source: item._id,
        totalLeads: item.count,
        conversions: item.conversions,
        conversionRate: item.count > 0 
          ? ((item.conversions / item.count) * 100).toFixed(2) 
          : "0.00",
      }));

      res.json(formattedData);
    } catch (error: any) {
      console.error("Lead source analysis error:", error);
      res.status(500).json({ message: "Failed to fetch lead source analysis" });
    }
  });

  app.get("/api/analytics/plot-category-performance", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const plotData = await PlotModel.aggregate([
        { 
          $group: { 
            _id: "$category", 
            total: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] }
            },
            booked: {
              $sum: { $cond: [{ $eq: ["$status", "Booked"] }, 1, 0] }
            },
            sold: {
              $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] }
            },
            avgPrice: { $avg: "$price" }
          } 
        },
        { $sort: { total: -1 } },
      ]);

      const formattedData = plotData.map(item => ({
        category: item._id,
        totalPlots: item.total,
        available: item.available,
        booked: item.booked,
        sold: item.sold,
        avgPrice: Math.round(item.avgPrice),
        occupancyRate: ((item.booked + item.sold) / item.total * 100).toFixed(2),
      }));

      res.json(formattedData);
    } catch (error: any) {
      console.error("Plot category performance error:", error);
      res.status(500).json({ message: "Failed to fetch plot category performance" });
    }
  });
}
