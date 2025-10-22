import bcrypt from "bcryptjs";
import { UserModel, LeadModel, ProjectModel, PlotModel } from "./models";

export async function seedDatabase() {
  try {
    // Check if admin already exists
    const adminExists = await UserModel.findOne({ email: "admin@example.com" });
    
    if (adminExists) {
      console.log("Admin user already exists. Skipping seed.");
      console.log("Login with: admin@example.com / password123");
      return;
    }
    
    console.log("Seeding database with initial data...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const admin = await UserModel.create({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      phone: "9876543210",
    });

    // Create salesperson
    const salesperson = await UserModel.create({
      name: "John Sales",
      email: "sales@example.com",
      password: hashedPassword,
      role: "salesperson",
      phone: "9876543211",
    });

    // Create sample project
    const project = await ProjectModel.create({
      name: "Green Valley Plots",
      location: "Bangalore, Karnataka",
      totalPlots: 50,
      description: "Premium residential plots with all modern amenities",
    });

    // Create sample plots
    const plotsData = [];
    for (let i = 1; i <= 20; i++) {
      plotsData.push({
        projectId: project._id,
        plotNumber: `A-${i.toString().padStart(3, "0")}`,
        size: `${1000 + i * 50} sq.ft`,
        price: 2000000 + i * 100000,
        facing: ["East", "West", "North", "South"][i % 4],
        status: i <= 15 ? "Available" : i <= 18 ? "Booked" : "Sold",
      });
    }
    await PlotModel.insertMany(plotsData);

    // Create sample leads
    const leadsData = [
      {
        name: "Rajesh Kumar",
        email: "rajesh@example.com",
        phone: "9876543212",
        source: "Website",
        status: "New",
        rating: "Urgent",
        notes: "Interested in east-facing plots",
      },
      {
        name: "Priya Sharma",
        email: "priya@example.com",
        phone: "9876543213",
        source: "Referral",
        status: "Contacted",
        rating: "Intermediate",
        assignedTo: salesperson._id,
        notes: "Looking for 1500+ sq.ft plots",
      },
      {
        name: "Amit Patel",
        phone: "9876543214",
        source: "Facebook",
        status: "Interested",
        rating: "Urgent",
        assignedTo: salesperson._id,
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: "Budget 25-30 lakhs",
      },
      {
        name: "Sneha Reddy",
        email: "sneha@example.com",
        phone: "9876543215",
        source: "Google Ads",
        status: "Site Visit",
        rating: "Urgent",
        assignedTo: salesperson._id,
        followUpDate: new Date(),
        notes: "Scheduled site visit for tomorrow",
      },
      {
        name: "Vikram Singh",
        phone: "9876543216",
        source: "Walk-in",
        status: "Booked",
        rating: "Urgent",
        assignedTo: salesperson._id,
        notes: "Booked plot A-016",
      },
    ];
    await LeadModel.insertMany(leadsData);

    console.log("Database seeded successfully!");
    console.log("Admin login: admin@example.com / password123");
    console.log("Salesperson login: sales@example.com / password123");
  } catch (error) {
    console.error("Seed error:", error);
  }
}
