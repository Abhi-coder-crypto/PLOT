import mongoose, { Schema, Document } from "mongoose";
import type {
  User,
  Lead,
  LeadInterest,
  Project,
  Plot,
  Payment,
  ActivityLog,
  BuyerInterest,
  UserRole,
  LeadStatus,
  LeadRating,
  LeadSource,
  PlotStatus,
  PlotCategory,
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
      enum: ["Urgent", "High", "Low"],
      default: "High",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    followUpDate: Date,
    notes: String,
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    plotIds: [{ type: Schema.Types.ObjectId, ref: "Plot" }],
    highestOffer: Number,
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
    category: {
      type: String,
      enum: ["Investment Plot", "Bungalow Plot", "Residential Plot", "Commercial Plot", "Open Plot"],
      required: true,
    },
    amenities: String,
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

// Buyer Interest Model
interface IBuyerInterest extends Omit<BuyerInterest, "_id">, Document {}

const buyerInterestSchema = new Schema<IBuyerInterest>(
  {
    plotId: { type: Schema.Types.ObjectId, ref: "Plot", required: true },
    buyerName: { type: String, required: true },
    buyerContact: { type: String, required: true },
    buyerEmail: String,
    offeredPrice: { type: Number, required: true },
    salespersonId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    salespersonName: { type: String, required: true },
    notes: String,
  },
  { timestamps: true }
);

export const BuyerInterestModel = mongoose.model<IBuyerInterest>(
  "BuyerInterest",
  buyerInterestSchema
);

// Lead Interest Model
interface ILeadInterest extends Omit<LeadInterest, "_id">, Document {}

const leadInterestSchema = new Schema<ILeadInterest>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    plotIds: [{ type: Schema.Types.ObjectId, ref: "Plot" }],
    highestOffer: { type: Number, required: true },
    notes: String,
  },
  { timestamps: true }
);

export const LeadInterestModel = mongoose.model<ILeadInterest>(
  "LeadInterest",
  leadInterestSchema
);
