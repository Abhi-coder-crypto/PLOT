import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, subMonths } from "date-fns";
import type {
  AnalyticsOverview,
  SalespersonPerformance,
  DailyMetric,
  MonthlyMetric,
  ActivityTimeline,
  LeadSourceAnalysis,
  PlotCategoryPerformance,
} from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Phone,
  Target,
  Activity,
  Calendar,
  Award,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("this_month");

  const getDateRange = () => {
    const now = new Date();
    const end = endOfDay(now);
    let start: Date;
    
    switch (dateRange) {
      case "today":
        start = startOfDay(now);
        break;
      case "this_week":
        start = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
        break;
      case "this_month":
        start = startOfMonth(now);
        break;
      case "last_3_months":
        start = startOfMonth(subMonths(now, 3));
        break;
      case "last_6_months":
        start = startOfMonth(subMonths(now, 6));
        break;
      default:
        start = startOfMonth(now);
    }
    
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  };

  const { startDate, endDate } = getDateRange();

  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["/api/analytics/overview", startDate, endDate],
  });

  const { data: performance, isLoading: performanceLoading } = useQuery<SalespersonPerformance[]>({
    queryKey: ["/api/analytics/salesperson-performance", startDate, endDate],
  });

  const { data: dailyMetrics, isLoading: dailyLoading } = useQuery<DailyMetric[]>({
    queryKey: ["/api/analytics/daily-metrics?days=30"],
  });

  const { data: monthlyMetrics, isLoading: monthlyLoading } = useQuery<MonthlyMetric[]>({
    queryKey: ["/api/analytics/monthly-metrics?months=12"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityTimeline[]>({
    queryKey: ["/api/analytics/activity-timeline?limit=20"],
  });

  const { data: leadSources, isLoading: leadSourcesLoading } = useQuery<LeadSourceAnalysis[]>({
    queryKey: ["/api/analytics/lead-source-analysis", startDate, endDate],
  });

  const { data: plotPerformance, isLoading: plotLoading } = useQuery<PlotCategoryPerformance[]>({
    queryKey: ["/api/analytics/plot-category-performance"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Comprehensive team performance and business insights
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewLoading ? (
            <>
              {[...Array(8)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-leads">
                    {overview?.totalLeads || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {overview?.activeLeads || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Conversions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-conversions">
                    {overview?.convertedLeads || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {overview?.conversionRate || "0.00"}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-revenue">
                    ₹{(overview?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {overview?.totalBookings || 0} bookings
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-team-size">
                    {overview?.totalSalespersons || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Active salespersons
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Buyer Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-buyer-interests">
                    {overview?.totalBuyerInterests || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Total inquiries
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Avg Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-avg-response">
                    {overview?.avgResponseTime || 0}h
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Average response time
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-bookings">
                    {overview?.totalBookings || 0}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Completed bookings
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-success-rate">
                    {overview?.conversionRate || "0.00"}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Lead to booking
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Performance (Last 30 Days)
              </CardTitle>
              <CardDescription>Leads, conversions, and buyer interests</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="leadsCreated" 
                      stroke="#3b82f6" 
                      name="Leads Created"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#10b981" 
                      name="Conversions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="buyerInterests" 
                      stroke="#f59e0b" 
                      name="Buyer Interests"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monthly Revenue & Conversions
              </CardTitle>
              <CardDescription>12-month trend analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="revenue" 
                      fill="#3b82f6" 
                      name="Revenue (₹)"
                    />
                    <Bar 
                      yAxisId="right"
                      dataKey="conversions" 
                      fill="#10b981" 
                      name="Conversions"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead Source Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Lead Source Performance
              </CardTitle>
              <CardDescription>Conversion by source channel</CardDescription>
            </CardHeader>
            <CardContent>
              {leadSourcesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leadSources}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ source, totalLeads }) => `${source}: ${totalLeads}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalLeads"
                    >
                      {leadSources?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Plot Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Plot Category Performance
              </CardTitle>
              <CardDescription>Occupancy rates by category</CardDescription>
            </CardHeader>
            <CardContent>
              {plotLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={plotPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" stackId="a" fill="#10b981" name="Available" />
                    <Bar dataKey="booked" stackId="a" fill="#f59e0b" name="Booked" />
                    <Bar dataKey="sold" stackId="a" fill="#ef4444" name="Sold" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Salesperson Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Salesperson Performance Leaderboard
            </CardTitle>
            <CardDescription>
              Individual performance metrics and rankings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Contacts</TableHead>
                      <TableHead>Leads Assigned</TableHead>
                      <TableHead>Conversions</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Buyer Interests</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance && performance.length > 0 ? (
                      performance.map((person, index) => (
                        <TableRow key={person.id} data-testid={`row-salesperson-${person.id}`}>
                          <TableCell>
                            <Badge
                              variant={index === 0 ? "default" : "outline"}
                              className={
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                  ? "bg-gray-400"
                                  : index === 2
                                  ? "bg-orange-600"
                                  : ""
                              }
                            >
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-name-${person.id}`}>
                            {person.name}
                          </TableCell>
                          <TableCell data-testid={`text-contacts-${person.id}`}>
                            {person.totalContacts}
                          </TableCell>
                          <TableCell data-testid={`text-assigned-${person.id}`}>
                            {person.leadsAssigned}
                          </TableCell>
                          <TableCell data-testid={`text-conversions-${person.id}`}>
                            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                              {person.conversions}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-rate-${person.id}`}>
                            <Badge
                              variant={person.conversionRate > 30 ? "default" : "secondary"}
                              className={
                                person.conversionRate > 30
                                  ? "bg-green-500"
                                  : person.conversionRate > 15
                                  ? "bg-yellow-500"
                                  : ""
                              }
                            >
                              {person.conversionRate}%
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-interests-${person.id}`}>
                            {person.buyerInterestsAdded}
                          </TableCell>
                          <TableCell data-testid={`text-revenue-${person.id}`}>
                            <span className="font-semibold">
                              ₹{person.revenue.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell data-testid={`text-last-activity-${person.id}`}>
                            {person.lastActivity ? (
                              <div className="text-sm">
                                <div>{format(new Date(person.lastActivity), 'PP')}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {person.lastActivityDetails}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">No activity</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-slate-500">
                          No salesperson data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity Timeline
            </CardTitle>
            <CardDescription>Latest team actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {activities && activities.length > 0 ? (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{activity.userDetails}</span>
                          <Badge variant="outline">{activity.action}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {activity.details}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {format(new Date(activity.createdAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">No recent activities</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
