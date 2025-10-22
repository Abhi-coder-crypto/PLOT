import { useLocation } from "wouter";

import { Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div
        className="text-center space-y-6"
      >
        <div
          className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10"
        >
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        
        <div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Button onClick={() => setLocation("/dashboard")} data-testid="button-go-home">
          <Home className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
