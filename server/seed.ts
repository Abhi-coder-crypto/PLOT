import bcrypt from "bcryptjs";
import { UserModel, LeadModel, ProjectModel, PlotModel, LeadInterestModel } from "./models";

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

    // Clear existing data
    await LeadInterestModel.deleteMany({});
    await LeadModel.deleteMany({});
    await PlotModel.deleteMany({});
    await ProjectModel.deleteMany({});
    await UserModel.deleteMany({ role: "salesperson" });

    // Create admin user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const admin = await UserModel.create({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      phone: "9876543210",
    });

    // Create 4 salespersons
    const salesperson1 = await UserModel.create({
      name: "Rahul Sharma",
      email: "rahul@example.com",
      password: hashedPassword,
      role: "salesperson",
      phone: "9876543211",
    });

    const salesperson2 = await UserModel.create({
      name: "Priya Patel",
      email: "priya@example.com",
      password: hashedPassword,
      role: "salesperson",
      phone: "9876543212",
    });

    const salesperson3 = await UserModel.create({
      name: "Amit Singh",
      email: "amit@example.com",
      password: hashedPassword,
      role: "salesperson",
      phone: "9876543213",
    });

    const salesperson4 = await UserModel.create({
      name: "Neha Desai",
      email: "neha@example.com",
      password: hashedPassword,
      role: "salesperson",
      phone: "9876543214",
    });

    // Create 2 projects
    const project1 = await ProjectModel.create({
      name: "Green Valley Residency",
      location: "Pune, Maharashtra",
      totalPlots: 5,
      description: "Premium residential plots with modern amenities",
    });

    const project2 = await ProjectModel.create({
      name: "Sunrise Heights",
      location: "Mumbai, Maharashtra",
      totalPlots: 5,
      description: "Luxury plots with scenic views",
    });

    // Create 5 plots for Project 1
    const project1Plots = [];
    const categories = ["Investment Plot", "Bungalow Plot", "Residential Plot", "Commercial Plot", "Open Plot"];
    const facings = ["East", "West", "North", "South"];
    
    for (let i = 1; i <= 5; i++) {
      project1Plots.push({
        projectId: project1._id,
        plotNumber: `GV-${i.toString().padStart(2, "0")}`,
        size: `${1200 + i * 100} sq.ft`,
        price: 2500000 + i * 150000,
        facing: facings[i % facings.length],
        status: "Available",
        category: categories[i % categories.length],
        amenities: "Water supply, Electricity, Road access, Park",
      });
    }
    const p1Plots = await PlotModel.insertMany(project1Plots);

    // Create 5 plots for Project 2
    const project2Plots = [];
    for (let i = 1; i <= 5; i++) {
      project2Plots.push({
        projectId: project2._id,
        plotNumber: `SH-${i.toString().padStart(2, "0")}`,
        size: `${1500 + i * 100} sq.ft`,
        price: 3000000 + i * 200000,
        facing: facings[i % facings.length],
        status: "Available",
        category: categories[i % categories.length],
        amenities: "Water supply, Electricity, Road access, Gym, Pool",
      });
    }
    const p2Plots = await PlotModel.insertMany(project2Plots);

    // Create 4 leads with names Abhijeet, Aniket, Sairaj, Pratik
    const lead1 = await LeadModel.create({
      name: "Abhijeet",
      email: "abhijeet@gmail.com",
      phone: "9876543215",
      source: "Website",
      status: "New",
      rating: "Urgent",
      assignedTo: salesperson1._id,
      notes: "Looking for investment plots",
    });

    const lead2 = await LeadModel.create({
      name: "Aniket",
      email: "aniket@gmail.com",
      phone: "9876543216",
      source: "Referral",
      status: "Contacted",
      rating: "High",
      assignedTo: salesperson2._id,
      notes: "Interested in bungalow plots",
    });

    const lead3 = await LeadModel.create({
      name: "Sairaj",
      email: "sairaj@gmail.com",
      phone: "9876543217",
      source: "Facebook",
      status: "Interested",
      rating: "High",
      assignedTo: salesperson3._id,
      followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      notes: "Budget 30-40 lakhs",
    });

    const lead4 = await LeadModel.create({
      name: "Pratik",
      email: "pratik@gmail.com",
      phone: "9876543218",
      source: "Google Ads",
      status: "Site Visit",
      rating: "Urgent",
      assignedTo: salesperson4._id,
      followUpDate: new Date(),
      notes: "Wants south-facing plots",
    });

    // Add lead interests - linking leads to projects/plots
    await LeadInterestModel.create({
      leadId: lead1._id,
      projectId: project1._id,
      plotIds: [p1Plots[0]._id, p1Plots[1]._id],
      highestOffer: 2600000,
      notes: "Interested in first two plots",
    });

    await LeadInterestModel.create({
      leadId: lead2._id,
      projectId: project2._id,
      plotIds: [p2Plots[2]._id],
      highestOffer: 3400000,
      notes: "Very interested in plot SH-03",
    });

    await LeadInterestModel.create({
      leadId: lead3._id,
      projectId: project1._id,
      plotIds: [p1Plots[2]._id, p1Plots[3]._id],
      highestOffer: 2800000,
      notes: "Looking at GV-03 and GV-04",
    });

    await LeadInterestModel.create({
      leadId: lead4._id,
      projectId: project2._id,
      plotIds: [p2Plots[0]._id, p2Plots[4]._id],
      highestOffer: 3100000,
      notes: "Wants south-facing options",
    });

    console.log("Database seeded successfully!");
    console.log("Admin login: admin@example.com / password123");
    console.log("Salesperson logins: rahul@example.com, priya@example.com, amit@example.com, neha@example.com / password123");
  } catch (error) {
    console.error("Seed error:", error);
  }
}
