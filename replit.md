# Plot Management CRM

## Overview
This is a full-featured Plot Management CRM web application for real estate businesses. It manages leads, salespersons, projects, plots, bookings, and payments. The application features a modern UI with a blue-gold color scheme, glassmorphism effects, and supports role-based access control for Admin and Salesperson roles, each with distinct dashboards and capabilities. The business vision is to provide a comprehensive tool for real estate management, enhancing efficiency in lead conversion, project oversight, and sales team performance.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build Tool**: React 18 with TypeScript, Vite for fast development.
- **Routing**: Wouter for lightweight client-side routing.
- **UI Component System**: ShadCN/UI (built on Radix UI) and Tailwind CSS for styling, adhering to Material Design principles with a blue-gold brand. Features include responsive, mobile-first design, glassmorphism effects, and light/dark mode.
- **State Management**: TanStack Query for server state, React Context API for authentication and theme, React Hook Form with Zod for form handling and validation.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript on Node.js, implementing a RESTful API.
- **Authentication & Authorization**: JWT for stateless authentication (stored in localStorage), bcryptjs for password hashing, custom middleware for role-based access control (Admin/Salesperson).
- **API Architecture**: Organized route handlers, middleware for authentication (`authenticateToken`) and admin-only routes (`requireAdmin`), and Zod schemas for request validation.

### Data Storage
- **Database**: MongoDB with Mongoose ODM for schema-based data modeling.
- **Data Models**:
    - **User**: Admin and salesperson accounts.
    - **Lead**: Customer leads with contact info, status, rating (Urgent/High/Low), source, and salesperson assignment.
    - **Project**: Real estate projects.
    - **Plot**: Individual plots with details like size, price, status (Available/Booked/Hold/Sold), and category.
    - **BuyerInterest**: Tracks potential buyers for plots, including offered price and assigned salesperson.
    - **Payment**: Booking payments with amount, mode, and type.
    - **ActivityLog**: Audit trail of user actions.
- **Schema Design**: TypeScript interfaces and Zod validation schemas shared between frontend and backend.

### System Design Choices
- **Comprehensive Analytics**: Advanced admin dashboard with 8 KPI cards, date range filters, salesperson leaderboard, daily/monthly performance charts, lead source distribution, plot category occupancy, and real-time activity timeline.
- **Projects & Plots Management**: Hierarchical table structure for projects, showing plot details, buyer interest counts, highest offers, and assigned salespersons. Category-based plot filtering (Investment Plot, Bungalow Plot, Residential Plot, Commercial Plot, Open Plot).
- **Lead Management**: Enhanced lead creation and editing forms with project/plot interest capture, optional highest offer, and salesperson assignment. Integration of LeadInterest with BuyerInterest for comprehensive tracking.
- **Data Export**: CSV/Excel export functionality for analytics and filtered lead data.

## External Dependencies

### Database Service
- **MongoDB**: NoSQL database. Requires `MONGODB_URI` environment variable.

### Third-Party Libraries
- **Google Fonts**: Inter (primary) and JetBrains Mono (monospace).
- **Radix UI**: Accessible UI component primitives.
- **date-fns**: Date manipulation utilities.
- **Heroicons** (via Lucide React): Icon system.

### Development Tools
- **Drizzle Kit**: Configured but not actively used with MongoDB.
- **ESBuild**: Bundler for backend production builds.
- **TSX**: TypeScript execution for development server.

### Deployment Requirements
- **Environment Variables**: `MONGODB_URI`, `SESSION_SECRET`, `NODE_ENV`.
- **Build Process**: `vite build` for frontend, `esbuild` for backend.