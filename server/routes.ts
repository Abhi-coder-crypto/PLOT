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
} from "@shared/schema";
import { startOfDay, endOfDay } from "date-fns";

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

      const leads = await LeadModel.find(query).sort({ createdAt: -1 });
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

      const leads = await LeadModel.find(query).sort({ followUpDate: 1 });
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

      const lead = await LeadModel.create(validationResult.data);

      // Log activity
      const authReq = req as AuthRequest;
      await ActivityLogModel.create({
        userId: authReq.user!._id,
        userName: authReq.user!.email,
        action: "Created Lead",
        entityType: "lead",
        entityId: lead._id,
        details: `Created lead for ${lead.name}`,
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
}
