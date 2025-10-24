import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, Search, ChevronDown, ChevronRight, Users, TrendingUp, Phone, Mail, User, DollarSign, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, InsertPlot, InsertProject, User as UserType, BuyerInterest } from "@shared/schema";
import { plotStatuses, plotCategories } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlotSchema, insertProjectSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";

interface ProjectOverview extends Project {
  totalPlots: number;
  availablePlots: number;
  bookedPlots: number;
  soldPlots: number;
  totalInterestedBuyers: number;
  plots: PlotWithInterests[];
}

interface PlotWithInterests {
  _id: string;
  projectId: string;
  plotNumber: string;
  size: string;
  price: number;
  facing?: string;
  status: string;
  category: string;
  amenities?: string;
  bookedBy?: string;
  buyerInterestCount: number;
  highestOffer: number;
  salespersons: Array<{ id: string; name: string }>;
}

export default function Plots() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedPlotId, setExpandedPlotId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: projectsOverview, isLoading } = useQuery<ProjectOverview[]>({
    queryKey: ["/api/projects/overview"],
  });

  const { data: salespersons } = useQuery<UserType[]>({
    queryKey: ["/api/users/salespersons"],
  });

  const { data: buyerInterests, isLoading: isLoadingInterests } = useQuery<BuyerInterest[]>({
    queryKey: ["/api/buyer-interests", expandedPlotId],
    enabled: !!expandedPlotId,
  });

  const projectForm = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      location: "",
      totalPlots: 0,
      description: "",
    },
  });

  const plotForm = useForm<InsertPlot>({
    resolver: zodResolver(insertPlotSchema),
    defaultValues: {
      projectId: "",
      plotNumber: "",
      size: "",
      price: 0,
      facing: "",
      status: "Available",
      category: "Residential Plot",
      amenities: "",
    },
  });


  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/overview"] });
      toast({ title: "Project created successfully" });
      setIsAddProjectOpen(false);
      projectForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPlotMutation = useMutation({
    mutationFn: (data: InsertPlot) => apiRequest("POST", "/api/plots", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/overview"] });
      toast({ title: "Plot created successfully" });
      setIsAddPlotOpen(false);
      plotForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });


  const handleProjectSubmit = (data: InsertProject) => {
    createProjectMutation.mutate(data);
  };

  const handlePlotSubmit = (data: InsertPlot) => {
    createPlotMutation.mutate(data);
  };


  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleBuyerInterestClick = (plotId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (expandedPlotId === plotId) {
      setExpandedPlotId(null);
    } else {
      setExpandedPlotId(plotId);
    }
  };


  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500 hover:bg-green-600 text-white";
      case "Booked":
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      case "Hold":
        return "bg-orange-500 hover:bg-orange-600 text-white";
      case "Sold":
        return "bg-red-500 hover:bg-red-600 text-white";
      default:
        return "bg-gray-500 hover:bg-gray-600 text-white";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  // Filter projects and plots
  const filteredProjects = projectsOverview?.map(project => ({
    ...project,
    plots: project.plots.filter(plot => {
      const matchesStatus = statusFilter === "all" || plot.status === statusFilter;
      const matchesSearch =
        searchQuery === "" ||
        plot.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
  })).filter(project => project.plots.length > 0 || searchQuery === "");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Projects & Plots Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track projects, plots, and buyer interests in one place
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shadow-sm" data-testid="button-add-project">
                    <Building2 className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>Create a new real estate project</DialogDescription>
                  </DialogHeader>
                  <Form {...projectForm}>
                    <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-4">
                      <FormField
                        control={projectForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Green Valley Plots" {...field} data-testid="input-project-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Bangalore, Karnataka" {...field} data-testid="input-project-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="totalPlots"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Plots</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-project-total-plots"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={projectForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Premium plots with all amenities" {...field} data-testid="input-project-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddProjectOpen(false)} data-testid="button-cancel-project">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
                          {createProjectMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddPlotOpen} onOpenChange={setIsAddPlotOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-sm" data-testid="button-add-plot">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Plot</DialogTitle>
                    <DialogDescription>Add a plot to a project</DialogDescription>
                  </DialogHeader>
                  <Form {...plotForm}>
                    <form onSubmit={plotForm.handleSubmit(handlePlotSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={plotForm.control}
                          name="projectId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-plot-project">
                                    <SelectValue placeholder="Select project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projectsOverview?.map((project) => (
                                    <SelectItem key={project._id} value={project._id}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={plotForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-plot-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {plotCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={plotForm.control}
                          name="plotNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plot Number</FormLabel>
                              <FormControl>
                                <Input placeholder="A-101" {...field} data-testid="input-plot-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={plotForm.control}
                          name="size"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Size</FormLabel>
                              <FormControl>
                                <Input placeholder="1200 sq.ft" {...field} data-testid="input-plot-size" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={plotForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (₹)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  data-testid="input-plot-price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={plotForm.control}
                          name="facing"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facing (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="East" {...field} data-testid="input-plot-facing" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={plotForm.control}
                        name="amenities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amenities (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Water supply, Electricity, Road access" {...field} data-testid="input-plot-amenities" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={plotForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-plot-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {plotStatuses.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddPlotOpen(false)} data-testid="button-cancel-plot">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPlotMutation.isPending} data-testid="button-submit-plot">
                          {createPlotMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project, plot ID, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {plotStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="text-muted-foreground"
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredProjects && filteredProjects.length > 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Total Plots</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Booked</TableHead>
                  <TableHead className="text-center">Sold</TableHead>
                  <TableHead className="text-center">Interested Buyers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <>
                    <TableRow 
                      key={project._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleProject(project._id)}
                      data-testid={`row-project-${project._id}`}
                    >
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {expandedProjects.has(project._id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-semibold" data-testid={`text-project-name-${project._id}`}>
                        {project.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.location}</TableCell>
                      <TableCell className="text-center">{project.totalPlots}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-500 text-white">{project.availablePlots}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-yellow-500 text-white">{project.bookedPlots}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-red-500 text-white">{project.soldPlots}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {project.totalInterestedBuyers}
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Plots Table */}
                    {expandedProjects.has(project._id) && project.plots.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 bg-muted/20">
                          <div className="p-4">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead>Plot Number</TableHead>
                                  <TableHead>Size</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-center">Buyer Interest</TableHead>
                                  <TableHead>Highest Offer</TableHead>
                                  <TableHead>Salespersons</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {project.plots.map((plot) => (
                                  <>
                                    <TableRow 
                                      key={plot._id}
                                      className="hover:bg-muted/30"
                                      data-testid={`row-plot-${plot._id}`}
                                    >
                                      <TableCell className="font-medium" data-testid={`text-plot-number-${plot._id}`}>
                                        {plot.plotNumber}
                                      </TableCell>
                                      <TableCell>{plot.size}</TableCell>
                                      <TableCell className="font-semibold text-primary">
                                        {formatCurrency(plot.price)}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={getStatusBadgeColor(plot.status)}>
                                          {plot.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant="outline" 
                                          className={`gap-1 ${plot.buyerInterestCount > 0 ? 'cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors' : ''} ${expandedPlotId === plot._id ? 'bg-primary/10 border-primary' : ''}`}
                                          onClick={plot.buyerInterestCount > 0 ? (e) => handleBuyerInterestClick(plot._id, e) : undefined}
                                          data-testid={`badge-buyer-interest-${plot._id}`}
                                        >
                                          <Users className="h-3 w-3" />
                                          {plot.buyerInterestCount}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {plot.highestOffer > 0 ? (
                                          <span className="font-semibold text-green-600 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            {formatCurrency(plot.highestOffer)}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {plot.salespersons.length > 0 ? (
                                          <div className="flex flex-wrap gap-1">
                                            {plot.salespersons.slice(0, 2).map((sp, idx) => (
                                              <Badge key={idx} variant="secondary" className="text-xs">
                                                {sp.name}
                                              </Badge>
                                            ))}
                                            {plot.salespersons.length > 2 && (
                                              <Badge variant="secondary" className="text-xs">
                                                +{plot.salespersons.length - 2}
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                    </TableRow>

                                    {/* Buyer Interest Details Section */}
                                    {expandedPlotId === plot._id && (
                                      <TableRow>
                                        <TableCell colSpan={7} className="p-0 bg-muted/10">
                                          <div className="p-4 border-t border-border">
                                            <div className="flex items-center gap-2 mb-3">
                                              <Users className="h-4 w-4 text-primary" />
                                              <h4 className="font-semibold text-sm">Interested Buyers for Plot {plot.plotNumber}</h4>
                                            </div>
                                            
                                            {isLoadingInterests ? (
                                              <div className="flex justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                              </div>
                                            ) : buyerInterests && buyerInterests.length > 0 ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {buyerInterests.map((interest, index) => (
                                                  <Card key={interest._id} className="overflow-hidden border-muted" data-testid={`card-buyer-interest-${index}`}>
                                                    <CardContent className="p-3">
                                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div className="space-y-2">
                                                          <div>
                                                            <p className="text-xs text-muted-foreground">Buyer Name</p>
                                                            <p className="font-semibold" data-testid={`text-buyer-name-${index}`}>
                                                              {interest.buyerName}
                                                            </p>
                                                          </div>
                                                          <div>
                                                            <p className="text-xs text-muted-foreground">Contact</p>
                                                            <p className="font-medium" data-testid={`text-buyer-contact-${index}`}>
                                                              {interest.buyerContact}
                                                            </p>
                                                          </div>
                                                          {interest.buyerEmail && (
                                                            <div>
                                                              <p className="text-xs text-muted-foreground">Email</p>
                                                              <p className="font-medium text-xs break-all" data-testid={`text-buyer-email-${index}`}>
                                                                {interest.buyerEmail}
                                                              </p>
                                                            </div>
                                                          )}
                                                        </div>
                                                        <div className="space-y-2">
                                                          <div>
                                                            <p className="text-xs text-muted-foreground">Offered Price</p>
                                                            <p className="font-bold text-base text-green-600 dark:text-green-400" data-testid={`text-offered-price-${index}`}>
                                                              {formatCurrency(interest.offeredPrice)}
                                                            </p>
                                                          </div>
                                                          <div>
                                                            <p className="text-xs text-muted-foreground">Salesperson</p>
                                                            <p className="font-medium" data-testid={`text-salesperson-${index}`}>
                                                              {interest.salespersonName}
                                                            </p>
                                                          </div>
                                                          {interest.notes && (
                                                            <div>
                                                              <p className="text-xs text-muted-foreground">Notes</p>
                                                              <p className="text-xs text-muted-foreground" data-testid={`text-notes-${index}`}>
                                                                {interest.notes}
                                                              </p>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      <Separator className="my-2" />
                                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                        <span>
                                                          Added: {new Date(interest.createdAt).toLocaleDateString('en-IN', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            year: 'numeric' 
                                                          })}
                                                        </span>
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                                <p className="text-sm font-medium text-foreground">No buyer interests yet</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  Buyer interests will appear here once added
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">No projects found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a new project to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
