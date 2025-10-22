import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, CheckCircle, DollarSign, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import type { SalespersonStats, Lead } from "@shared/schema";
import { format } from "date-fns";

export default function SalespersonDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery<SalespersonStats>({
    queryKey: ["/api/dashboard/salesperson"],
  });

  const { data: todayFollowUps, isLoading: followUpsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads/today-followups"],
  });

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Hot": return "bg-chart-3 text-white";
      case "Warm": return "bg-chart-4 text-foreground";
      case "Cold": return "bg-destructive text-white";
      default: return "bg-secondary";
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your performance and today's tasks</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Assigned Leads"
          value={stats?.assignedLeads || 0}
          icon={ClipboardList}
          gradient="from-primary to-primary/70"
          delay={0}
        />
        <StatCard
          title="Today's Follow-ups"
          value={stats?.todayFollowUps || 0}
          icon={Calendar}
          gradient="from-accent to-accent/70"
          delay={0.1}
        />
        <StatCard
          title="Converted Leads"
          value={stats?.convertedLeads || 0}
          icon={CheckCircle}
          gradient="from-chart-3 to-chart-3/70"
          delay={0.2}
        />
        <StatCard
          title="Total Revenue"
          value={`₹${((stats?.totalRevenue || 0) / 100000).toFixed(1)}L`}
          icon={DollarSign}
          gradient="from-chart-2 to-chart-2/70"
          delay={0.3}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Today's Follow-ups</CardTitle>
            <CardDescription>Leads scheduled for follow-up today</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/leads")}
            data-testid="button-view-all-leads"
          >
            View All Leads
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {followUpsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : todayFollowUps && todayFollowUps.length > 0 ? (
              <div className="space-y-3">
                {todayFollowUps.map((lead) => (
                  <motion.div
                    key={lead._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start justify-between p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`followup-${lead._id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">{lead.name}</p>
                        <Badge className={getRatingColor(lead.rating)} data-testid={`badge-rating-${lead._id}`}>
                          {lead.rating}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{lead.phone}</p>
                      {lead.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lead.notes}</p>
                      )}
                      {lead.followUpDate && (
                        <p className="text-xs text-accent font-medium mt-2">
                          Follow-up: {format(new Date(lead.followUpDate), "PPp")}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setLocation(`/leads?id=${lead._id}`)}
                      data-testid={`button-view-lead-${lead._id}`}
                    >
                      View
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-lg font-medium text-foreground">No follow-ups today</p>
                <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
