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

// Plot categories
export const plotCategories = ["Investment Plot", "Bungalow Plot", "Residential Plot", "Commercial Plot", "Open Plot"] as const;
export type PlotCategory = typeof plotCategories[number];

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

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(userRoles),
  phone: z.string().optional(),
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// ============= Lead Schema =============
export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  rating: LeadRating;
  assignedTo?: string | PopulatedUser;
  assignedBy?: string | PopulatedUser;
  followUpDate?: Date;
  notes?: string;
  projectId?: string;
  plotIds?: string[];
  highestOffer?: number;
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
  projectId: z.string().optional(),
  plotIds: z.array(z.string()).optional(),
  highestOffer: z.coerce.number().min(0, "Offer must be positive").optional(),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;

// ============= Lead Interest Schema =============
export interface LeadInterest {
  _id: string;
  leadId: string;
  projectId: string;
  plotIds: string[];
  highestOffer: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertLeadInterestSchema = z.object({
  leadId: z.string().min(1, "Lead is required"),
  projectId: z.string().min(1, "Project is required"),
  plotIds: z.array(z.string()).min(1, "At least one plot must be selected"),
  highestOffer: z.number().min(0, "Offer must be positive"),
  notes: z.string().optional(),
});

export type InsertLeadInterest = z.infer<typeof insertLeadInterestSchema>;

export const assignLeadSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson ID is required"),
});

export type AssignLead = z.infer<typeof assignLeadSchema>;

export const transferLeadSchema = z.object({
  salespersonId: z.string().min(1, "Salesperson ID is required"),
});

export type TransferLead = z.infer<typeof transferLeadSchema>;

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
  category: PlotCategory;
  amenities?: string;
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
  category: z.enum(plotCategories),
  amenities: z.string().optional(),
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

// ============= Buyer Interest Schema =============
export interface BuyerInterest {
  _id: string;
  plotId: string;
  buyerName: string;
  buyerContact: string;
  buyerEmail?: string;
  offeredPrice: number;
  salespersonId: string;
  salespersonName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const insertBuyerInterestSchema = z.object({
  plotId: z.string().min(1, "Plot is required"),
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerContact: z.string().min(10, "Contact number must be at least 10 digits"),
  buyerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  offeredPrice: z.number().min(0, "Offered price must be positive"),
  salespersonId: z.string().min(1, "Salesperson is required"),
  notes: z.string().optional(),
});

export type InsertBuyerInterest = z.infer<typeof insertBuyerInterestSchema>;

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

// ============= Analytics Types =============
export interface AnalyticsOverview {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: string;
  totalSalespersons: number;
  totalRevenue: number;
  totalBuyerInterests: number;
  totalBookings: number;
  avgResponseTime: number;
  activeLeads: number;
}

export interface SalespersonPerformance {
  id: string;
  name: string;
  email: string;
  totalContacts: number;
  leadsAssigned: number;
  conversions: number;
  conversionRate: number;
  buyerInterestsAdded: number;
  revenue: number;
  lastActivity: string | null;
  lastActivityDetails: string;
}

export interface DailyMetric {
  date: string;
  leadsCreated: number;
  conversions: number;
  buyerInterests: number;
  bookings: number;
}

export interface MonthlyMetric {
  month: string;
  leadsCreated: number;
  conversions: number;
  revenue: number;
}

export interface ActivityTimeline {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  details: string;
  createdAt: string;
  userDetails: string;
}

export interface LeadSourceAnalysis {
  source: string;
  totalLeads: number;
  conversions: number;
  conversionRate: string;
}

export interface PlotCategoryPerformance {
  category: string;
  totalPlots: number;
  available: number;
  booked: number;
  sold: number;
  avgPrice: number;
  occupancyRate: string;
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
