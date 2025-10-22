import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import SalespersonDashboard from "@/pages/salesperson-dashboard";
import Leads from "@/pages/leads";
import Salespersons from "@/pages/salespersons";
import Plots from "@/pages/plots";
import Analytics from "@/pages/analytics";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) return null;

  return <Component />;
}

function DashboardRoute() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboard /> : <SalespersonDashboard />;
}

function Router() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardRoute} />} />
      <Route path="/leads" component={() => <ProtectedRoute component={Leads} />} />
      {isAdmin && (
        <Route path="/salespersons" component={() => <ProtectedRoute component={Salespersons} />} />
      )}
      <Route path="/plots" component={() => <ProtectedRoute component={Plots} />} />
      {isAdmin && (
        <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      )}
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/" component={() => <ProtectedRoute component={DashboardRoute} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppContent style={style} />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppContent({ style }: { style: any }) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated || location === "/login") {
    return <Router />;
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
