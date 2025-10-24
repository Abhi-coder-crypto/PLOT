import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      _id: string;
      name: string;
      email: string;
      role: UserRole;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function generateToken(payload: { _id: string; name: string; email: string; role: UserRole }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}
