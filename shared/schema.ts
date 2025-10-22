import { z } from "zod";

// User roles
export const userRoles = ["admin", "salesperson"] as const;
export type UserRole = typeof userRoles[number];

// Lead statuses
export const leadStatuses = ["New", "Contacted", "Interested", "Site Visit", "Booked", "Lost"] as const;
export type LeadStatus = typeof leadStatuses[number];

// Lead ratings
export const leadRatings = ["Urgent", "High", "Low"] as const;
export type LeadRating = typeof leadRatings[number];

// Lead sources
export const leadSources = ["Website", "Facebook", "Google Ads", "Referral", "Walk-in", "Other"] as const;
export type LeadSource = typeof leadSources[number];

// Plot statuses
export const plotStatuses = ["Available", "Booked", "Hold", "Sold"] as const;
export type PlotStatus = typeof plotStatuses[number];

// Payment modes
export const paymentModes = ["Cash", "UPI", "Cheque", "Bank Transfer"] as const;
export type PaymentMode = typeof paymentModes[number];

// Booking types
export const bookingTypes = ["Token", "Full"] as const;
export type BookingType = typeof bookingTypes[number];

// ============= User Schema =============
export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
}

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(userRoles),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// ============= Lead Schema =============
export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  rating: LeadRating;
  assignedTo?: string;
  assignedBy?: string;
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  source: z.enum(leadSources),
  status: z.enum(leadStatuses).default("New"),
  rating: z.enum(leadRatings).default("High"),
  assignedTo: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

export const assignLeadSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson ID is required"),
});

export type AssignLead = z.infer<typeof assignLeadSchema>;

// ============= Project Schema =============
export interface Project {
  _id: string;
  name: string;
  location: string;
  totalPlots: number;
  description?: string;
  createdAt: Date;
}

export const insertProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  location: z.string().min(1, "Location is required"),
  totalPlots: z.number().min(1, "Total plots must be at least 1"),
  description: z.string().optional(),
});

export type InsertProject = z.infer<typeof insertProjectSchema>;

// ============= Plot Schema =============
export interface Plot {
  _id: string;
  projectId: string;
  plotNumber: string;
  size: string;
  price: number;
  facing?: string;
  status: PlotStatus;
  bookedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertPlotSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  plotNumber: z.string().min(1, "Plot number is required"),
  size: z.string().min(1, "Size is required"),
  price: z.number().min(0, "Price must be positive"),
  facing: z.string().optional(),
  status: z.enum(plotStatuses).default("Available"),
});

export type InsertPlot = z.infer<typeof insertPlotSchema>;

// ============= Payment Schema =============
export interface Payment {
  _id: string;
  leadId: string;
  plotId: string;
  amount: number;
  mode: PaymentMode;
  bookingType: BookingType;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
}

export const insertPaymentSchema = z.object({
  leadId: z.string().min(1, "Lead is required"),
  plotId: z.string().min(1, "Plot is required"),
  amount: z.number().min(0, "Amount must be positive"),
  mode: z.enum(paymentModes),
  bookingType: z.enum(bookingTypes),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// ============= Activity Log Schema =============
export interface ActivityLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: "lead" | "plot" | "payment" | "user";
  entityId: string;
  details: string;
  createdAt: Date;
}

export const insertActivityLogSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  action: z.string(),
  entityType: z.enum(["lead", "plot", "payment", "user"]),
  entityId: z.string(),
  details: z.string(),
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// ============= Dashboard Stats =============
export interface DashboardStats {
  totalLeads: number;
  convertedLeads: number;
  lostLeads: number;
  unassignedLeads: number;
  totalProjects: number;
  totalPlots: number;
  availablePlots: number;
  bookedPlots: number;
  totalRevenue: number;
  todayFollowUps: number;
}

export interface SalespersonStats {
  assignedLeads: number;
  todayFollowUps: number;
  convertedLeads: number;
  totalRevenue: number;
}

// ============= API Response Types =============
export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}
