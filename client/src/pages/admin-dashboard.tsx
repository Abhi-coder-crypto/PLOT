import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, XCircle, UserX, Building2, Home, DollarSign, Calendar, Mail, Phone, TrendingUp, Award } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { DashboardStats, ActivityLog, SalespersonPerformance } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const [selectedSalesperson, setSelectedSalesperson] = useState<SalespersonPerformance | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/admin"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activities"],
  });

  const { data: salespersonPerformance, isLoading: performanceLoading } = useQuery<SalespersonPerformance[]>({
    queryKey: ["/api/analytics/salesperson-performance"],
  });

  const handleSalespersonClick = (salesperson: SalespersonPerformance) => {
    setSelectedSalesperson(salesperson);
    setIsDialogOpen(true);
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your business summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={Users}
          gradient="from-primary to-primary/70"
          delay={0}
        />
        <StatCard
          title="Converted Leads"
          value={stats?.convertedLeads || 0}
          icon={CheckCircle}
          gradient="from-chart-3 to-chart-3/70"
          delay={0.1}
        />
        <StatCard
          title="Available Plots"
          value={stats?.availablePlots || 0}
          icon={Home}
          gradient="from-accent to-accent/70"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lost Leads</span>
              <Badge variant="destructive" data-testid="badge-lost-leads">
                {stats?.lostLeads || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unassigned Leads</span>
              <Badge variant="secondary" data-testid="badge-unassigned-leads">
                {stats?.unassignedLeads || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Projects</span>
              <Badge className="bg-primary" data-testid="badge-total-projects">
                {stats?.totalProjects || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Booked Plots</span>
              <Badge className="bg-chart-3" data-testid="badge-booked-plots">
                {stats?.bookedPlots || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Today's Follow-ups</span>
              <Badge className="bg-accent" data-testid="badge-today-followups">
                {stats?.todayFollowUps || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {activitiesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="flex gap-3 pb-3 border-b border-border last:border-0"
                      data-testid={`activity-${activity._id}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          by {activity.userName} • {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salesperson Performance</CardTitle>
          <CardDescription>Click on a salesperson to view detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : salespersonPerformance && salespersonPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salespersonPerformance.map((salesperson) => (
                <Card
                  key={salesperson.id}
                  className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary"
                  onClick={() => handleSalespersonClick(salesperson)}
                  data-testid={`card-salesperson-${salesperson.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {salesperson.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{salesperson.name}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate">{salesperson.email}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Leads Assigned</span>
                      <Badge variant="secondary">{salesperson.leadsAssigned}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversions</span>
                      <Badge className="bg-chart-3">{salesperson.conversions}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Conversion Rate</span>
                      <Badge className="bg-primary">{salesperson.conversionRate}%</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold">₹{(salesperson.revenue / 100000).toFixed(1)}L</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No salesperson data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Salesperson Details</DialogTitle>
            <DialogDescription>Detailed performance information</DialogDescription>
          </DialogHeader>
          {selectedSalesperson && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                  {selectedSalesperson.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedSalesperson.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{selectedSalesperson.email}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Contacts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSalesperson.totalContacts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Leads Assigned</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSalesperson.leadsAssigned}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-3">{selectedSalesperson.conversions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold">{selectedSalesperson.conversionRate}%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Buyer Interests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSalesperson.buyerInterestsAdded}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-chart-2">₹{(selectedSalesperson.revenue / 100000).toFixed(1)}L</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSalesperson.lastActivity ? (
                    <div className="space-y-1">
                      <p className="text-sm">{selectedSalesperson.lastActivityDetails}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedSalesperson.lastActivity), { addSuffix: true })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
