# Plot Management CRM - Design Guidelines

## Design Approach
**System-Based Approach**: Material Design + ShadCN/UI components with custom blue-gold branding and glassmorphism effects for a modern, professional real estate CRM aesthetic.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary Blue: 220 80% 45% (professional trust)
- Gold Accent: 45 90% 55% (premium feel)
- Success Green: 142 76% 36% (available plots)
- Warning Yellow: 45 93% 47% (hold/warm leads)
- Danger Red: 0 84% 60% (booked plots/cold leads)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 220 10% 20%
- Text Secondary: 220 10% 45%

**Dark Mode:**
- Primary Blue: 220 80% 60%
- Gold Accent: 45 90% 65%
- Success Green: 142 76% 45%
- Warning Yellow: 45 93% 60%
- Danger Red: 0 84% 70%
- Background: 220 15% 8%
- Surface: 220 15% 12% (glassmorphism: backdrop-blur-lg bg-opacity-80)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

### B. Typography
- **Primary Font**: Inter (Google Fonts) - headings and body
- **Monospace**: JetBrains Mono - data tables, numbers
- **Sizes**: text-xs (11px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (30px), text-4xl (36px)
- **Weights**: font-medium (500) for labels, font-semibold (600) for headings, font-bold (700) for emphasis

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 (e.g., p-4, gap-6, mt-8, mb-12)
- Sidebar: Fixed width 16rem (w-64)
- Main Content: ml-64 with p-6 to p-8 padding
- Cards: p-6 with rounded-xl shadow-lg
- Modals: max-w-2xl to max-w-4xl centered

### D. Component Library

**Navigation:**
- Sidebar: Fixed left, bg-surface with glassmorphism, icons from Heroicons, active state with blue background glow
- Top Navbar: Sticky top, backdrop-blur-lg, user profile (avatar + dropdown), notification bell with badge counter

**Data Display:**
- Dashboard Cards: Animated on load (Framer Motion fade-in), gradient backgrounds for stats, large numbers with icons
- Tables: Striped rows, sortable headers (arrows), search bar top-right, pagination bottom, row hover with blue tint
- Plot Grid: CSS Grid responsive (grid-cols-4 lg:grid-cols-6 xl:grid-cols-8), each plot as clickable colored box with plot number overlay

**Forms & Modals:**
- Popup Modals: Centered overlay with backdrop blur, slide-in animation, max-w-2xl, close button top-right
- Input Fields: Consistent with dark mode (dark bg-surface, light borders), floating labels on focus
- Buttons: Primary (blue gradient), Secondary (outline blue), Success (green), Danger (red), all with hover lift effect

**Status Indicators:**
- Lead Stages: Pill badges with colors - Hot (green bg), Warm (yellow bg), Cold (red bg)
- Booking Status: Booked (green), Hold (yellow), Lost (red)
- Icons: Use Heroicons for consistency

### E. Animations
- **Dashboard Entry**: Stagger children cards with 100ms delay, fade-in + slide-up (Framer Motion)
- **Modal Open/Close**: Scale from 0.95 to 1, fade backdrop
- **Button Hover**: Subtle scale(1.02) and shadow increase
- **Plot Grid Hover**: Scale(1.05) with smooth transition
- **Table Row Hover**: Background color transition only (no movement)
- **Page Transitions**: Minimal - fade between routes

## Module-Specific Design

### Authentication Pages
- Centered card on gradient background (blue to dark blue diagonal)
- Logo top center, form in glassmorphism card (max-w-md)
- No hero image - focus on clean login form

### Admin Dashboard
- Top Row: 4 animated stat cards (Total Leads, Conversions, Revenue, Available Plots) with gradient backgrounds
- Middle: Dual-column layout - left: recent activity timeline, right: salesperson leaderboard table
- Bottom: Chart row - lead source pie chart (Recharts) and weekly revenue line chart
- All cards with glassmorphism effect and subtle shadow

### Lead Management
- Table view default with filters sidebar (collapsible)
- Color-coded status column with pill badges
- Action buttons (edit, delete, assign) in last column
- "Add Lead" button top-right, opens modal with multi-step form
- Lead detail modal: tabs for Info, History, Follow-ups, Documents

### Plot Management  
- Project selector dropdown top-left
- Interactive plot grid below: each plot as square/rectangle with plot number, size, and color-coded by status
- Click plot opens booking modal or detail view
- Legend bottom showing color meanings (Green=Available, Red=Booked, Yellow=Hold)

### Salesperson Dashboard
- Simplified version of admin dashboard
- Top: "Today's Follow-ups" prominent section with list cards
- Middle: Assigned leads table (simplified)
- Bottom: Personal performance metrics (conversion rate, total bookings)

### Modals
- Add/Edit Lead: Multi-field form with sections (Contact Info, Lead Details, Assignment)
- Book Plot: Customer details + plot selection + payment info tabs
- All modals use consistent padding (p-6), rounded-xl, and smooth animations

## Responsive Behavior
- Desktop (lg+): Full sidebar visible, multi-column layouts
- Tablet (md): Sidebar collapses to icons only, 2-column cards
- Mobile (base): Hamburger menu, single column, bottom navigation for key actions

## Dark Mode Toggle
- Switch in top-right navbar (moon/sun icon)
- Smooth transition-colors on all elements
- Persist preference in localStorage

This design creates a professional, animated, and highly functional CRM that balances aesthetics with usability for real estate plot management.