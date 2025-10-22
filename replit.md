# Plot Management CRM

## Overview

This is a full-featured Plot Management CRM web application designed for real estate businesses to manage leads, salespersons, projects, plots, bookings, and payments. The application features a modern, beautiful UI with a blue-gold color scheme, glassmorphism effects, and smooth animations using Framer Motion. It supports role-based access control with Admin and Salesperson roles, providing different dashboards and capabilities for each user type.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast hot module replacement
- **Wouter** for lightweight client-side routing instead of React Router

**UI Component System**
- **ShadCN/UI** component library built on Radix UI primitives for accessible, unstyled components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Framer Motion** for smooth animations and transitions throughout the UI
- Design system follows Material Design principles with custom blue-gold branding

**State Management**
- **TanStack Query (React Query)** for server state management, caching, and data fetching
- **React Context API** for authentication state and theme management (light/dark mode)
- Forms handled via **React Hook Form** with **Zod** schema validation

**Design Philosophy**
- Responsive, mobile-first design with glassmorphism effects
- Light and dark mode support with theme toggle
- Color-coded status indicators (Hot/Warm/Cold leads, Available/Booked/Hold plots)
- Animated dashboard with statistical cards and data visualizations

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- RESTful API design pattern with JSON request/response format
- Middleware for logging, JSON parsing, and error handling

**Authentication & Authorization**
- **JWT (JSON Web Tokens)** for stateless authentication
- Token-based auth stored in localStorage on client side
- **bcryptjs** for secure password hashing
- Custom middleware for route protection and role-based access control
- Two user roles: Admin (full access) and Salesperson (limited access)

**API Architecture**
- Organized route handlers in `/server/routes.ts`
- Middleware for authentication (`authenticateToken`) and admin-only routes (`requireAdmin`)
- Request validation using Zod schemas from shared schema definitions

### Data Storage

**Database**
- **MongoDB** with **Mongoose** ODM for schema-based data modeling
- Cloud or local MongoDB deployment via connection string
- Connection pooling and automatic reconnection handling

**Data Models**
The application uses the following core data models:
- **User**: Admin and salesperson accounts with authentication credentials
- **Lead**: Customer leads with contact info, status, rating (Hot/Warm/Cold), source, and assignment to salesperson
- **Project**: Real estate projects containing multiple plots
- **Plot**: Individual plots with size, price, facing direction, and status (Available/Booked/Hold/Sold)
- **Payment**: Booking payments with amount, mode (Cash/UPI/Cheque/Bank Transfer), and type (Token/Full)
- **ActivityLog**: Audit trail of user actions across the system

**Schema Design**
- TypeScript interfaces and Zod validation schemas defined in `/shared/schema.ts`
- Shared between frontend and backend for type safety
- Mongoose schemas in `/server/models.ts` map to the shared types
- Timestamps automatically added to all documents

### External Dependencies

**Database Service**
- **MongoDB**: NoSQL database requiring `MONGODB_URI` environment variable
- **Neon Serverless** package included (note: configured for PostgreSQL in drizzle.config.ts but MongoDB is actively used)

**Third-Party Libraries**
- **Google Fonts**: Inter (primary font) and JetBrains Mono (monospace for data)
- **Radix UI**: 20+ accessible UI component primitives (@radix-ui/react-*)
- **date-fns**: Date formatting and manipulation utilities
- **Heroicons** (via Lucide React): Icon system for UI components

**Development Tools**
- **Drizzle Kit**: Database migration tool (configured but not actively used with MongoDB)
- **ESBuild**: Bundler for production builds
- **TSX**: TypeScript execution for development server
- **Replit Vite Plugins**: Development enhancements for Replit environment

**Deployment Requirements**
- Environment variables needed: `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV`
- Build process: `vite build` for frontend, `esbuild` for backend
- Production server runs compiled JavaScript from `/dist` directory

**Data Seeding**
- Initial database seed in `/server/seed.ts` creates:
  - Default admin account (admin@example.com / password123)
  - Sample salesperson account
  - Demo project with 20 plots in various states
  - Sample leads for testing