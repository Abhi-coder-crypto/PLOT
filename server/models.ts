import mongoose, { Schema, Document } from "mongoose";
import type {
  User,
  Lead,
  Project,
  Plot,
  Payment,
  ActivityLog,
  UserRole,
  LeadStatus,
  LeadRating,
  LeadSource,
  PlotStatus,
  PaymentMode,
  BookingType,
} from "@shared/schema";

// User Model
interface IUser extends Omit<User, "_id">, Document {}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "salesperson"],
      required: true,
    },
    phone: String,
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", userSchema);

// Lead Model
interface ILead extends Omit<Lead, "_id">, Document {}

const leadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    source: {
      type: String,
      enum: ["Website", "Facebook", "Google Ads", "Referral", "Walk-in", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Interested", "Site Visit", "Booked", "Lost"],
      default: "New",
    },
    rating: {
      type: String,
      enum: ["Urgent", "Intermediate", "Low"],
      default: "Intermediate",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    followUpDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const LeadModel = mongoose.model<ILead>("Lead", leadSchema);

// Project Model
interface IProject extends Omit<Project, "_id">, Document {}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    totalPlots: { type: Number, required: true },
    description: String,
  },
  { timestamps: true }
);

export const ProjectModel = mongoose.model<IProject>("Project", projectSchema);

// Plot Model
interface IPlot extends Omit<Plot, "_id">, Document {}

const plotSchema = new Schema<IPlot>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    plotNumber: { type: String, required: true },
    size: { type: String, required: true },
    price: { type: Number, required: true },
    facing: String,
    status: {
      type: String,
      enum: ["Available", "Booked", "Hold", "Sold"],
      default: "Available",
    },
    bookedBy: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true }
);

export const PlotModel = mongoose.model<IPlot>("Plot", plotSchema);

// Payment Model
interface IPayment extends Omit<Payment, "_id">, Document {}

const paymentSchema = new Schema<IPayment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    plotId: { type: Schema.Types.ObjectId, ref: "Plot", required: true },
    amount: { type: Number, required: true },
    mode: {
      type: String,
      enum: ["Cash", "UPI", "Cheque", "Bank Transfer"],
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["Token", "Full"],
      required: true,
    },
    transactionId: String,
    notes: String,
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);

// Activity Log Model
interface IActivityLog extends Omit<ActivityLog, "_id">, Document {}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["lead", "plot", "payment", "user"],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

export const ActivityLogModel = mongoose.model<IActivityLog>(
  "ActivityLog",
  activityLogSchema
);
