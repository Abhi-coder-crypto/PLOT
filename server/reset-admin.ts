import bcrypt from "bcryptjs";
import { UserModel } from "./models";
import { connectDB } from "./db";

async function resetAdminPassword() {
  try {
    await connectDB();
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const result = await UserModel.updateOne(
      { email: "admin@example.com" },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount > 0) {
      console.log("✓ Admin password reset successfully");
      console.log("Login with: admin@example.com / password123");
    } else {
      console.log("✗ Admin user not found");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  }
}

resetAdminPassword();
