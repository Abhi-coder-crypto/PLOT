import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, Search, Filter, X, User, Phone, Mail, DollarSign, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Plot, Project, InsertPlot, InsertProject, PlotCategory, InsertBuyerInterest, User as UserType } from "@shared/schema";
import { plotStatuses, plotCategories } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlotSchema, insertProjectSchema, insertBuyerInterestSchema } from "@shared/schema";
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

interface PlotStats {
  totalInterestedBuyers: number;
  averageOfferedPrice: number;
  highestOffer: number;
  buyerInterests: Array<{
    _id: string;
    buyerName: string;
    buyerContact: string;
    buyerEmail?: string;
    offeredPrice: number;
    salespersonId: string;
    salespersonName: string;
    notes?: string;
    createdAt: string;
  }>;
}

export default function Plots() {
  const [selectedCategory, setSelectedCategory] = useState<PlotCategory | "all">("all");
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [isPlotDetailsOpen, setIsPlotDetailsOpen] = useState(false);
  const [isAddInterestOpen, setIsAddInterestOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: plots, isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: plotStats } = useQuery<PlotStats>({
    queryKey: [`/api/plots/${selectedPlot?._id}/stats`],
    enabled: !!selectedPlot,
  });

  const { data: salespersons } = useQuery<UserType[]>({
    queryKey: ["/api/users/salespersons"],
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

  const buyerInterestForm = useForm<InsertBuyerInterest>({
    resolver: zodResolver(insertBuyerInterestSchema),
    defaultValues: {
      plotId: "",
      buyerName: "",
      buyerContact: "",
      buyerEmail: "",
      offeredPrice: 0,
      salespersonId: "",
      notes: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: InsertProject) => apiRequest("POST", "/api/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      toast({ title: "Plot created successfully" });
      setIsAddPlotOpen(false);
      plotForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createBuyerInterestMutation = useMutation({
    mutationFn: (data: InsertBuyerInterest) => apiRequest("POST", "/api/buyer-interests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/plots/${selectedPlot?._id}/stats`] });
      toast({ title: "Buyer interest added successfully" });
      setIsAddInterestOpen(false);
      buyerInterestForm.reset();
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

  const handleBuyerInterestSubmit = (data: InsertBuyerInterest) => {
    if (selectedPlot) {
      createBuyerInterestMutation.mutate({
        ...data,
        plotId: selectedPlot._id,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
      case "Booked":
        return "bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-400";
      case "Hold":
        return "bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400";
      case "Sold":
        return "bg-red-500/10 border-red-500 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 border-gray-500 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500 hover:bg-green-600";
      case "Booked":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "Hold":
        return "bg-orange-500 hover:bg-orange-600";
      case "Sold":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getProjectName = (projectId: string) => {
    return projects?.find((p) => p._id === projectId)?.name || "Unknown Project";
  };

  const getProjectLocation = (projectId: string) => {
    return projects?.find((p) => p._id === projectId)?.location || "";
  };

  // Filter plots by category, status, and search
  const filteredPlots = plots?.filter((plot) => {
    const matchesCategory = selectedCategory === "all" || plot.category === selectedCategory;
    const matchesStatus = statusFilter === "all" || plot.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      plot.plotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProjectLocation(plot.projectId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handlePlotClick = (plot: Plot) => {
    setSelectedPlot(plot);
    setIsPlotDetailsOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(2)}L`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Plot Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage plots by category with advanced buyer tracking
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shadow-sm">
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
                              <Input placeholder="Green Valley Plots" {...field} />
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
                              <Input placeholder="Bangalore, Karnataka" {...field} />
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
                              <Input placeholder="Premium plots with all amenities" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddProjectOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createProjectMutation.isPending}>
                          {createProjectMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddPlotOpen} onOpenChange={setIsAddPlotOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plot
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Plot</DialogTitle>
                    <DialogDescription>Add a plot with category and details</DialogDescription>
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
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projects?.map((project) => (
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
                                  <SelectTrigger>
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
                                <Input placeholder="A-101" {...field} />
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
                                <Input placeholder="1200 sq.ft" {...field} />
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
                                <Input placeholder="East" {...field} />
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
                              <Input placeholder="Water supply, Electricity, Road access" {...field} />
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
                                <SelectTrigger>
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
                        <Button type="button" variant="outline" onClick={() => setIsAddPlotOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPlotMutation.isPending}>
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

      {/* Category Tabs */}
      <Card className="shadow-lg border-2">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="transition-all duration-200 hover:scale-105 shadow-sm"
            >
              All Plots
            </Button>
            {plotCategories.map((category) => (
              <motion.div key={category} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="transition-all duration-200 shadow-sm"
                >
                  {category}
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by plot ID or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
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
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plot Grid */}
      {plotsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredPlots && filteredPlots.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredPlots.map((plot) => (
              <motion.div
                key={plot._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 border-2 hover:shadow-xl ${getStatusColor(
                    plot.status
                  )}`}
                  onClick={() => handlePlotClick(plot)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-bold">{plot.plotNumber}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {getProjectName(plot.projectId)}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusBadgeColor(plot.status)} text-white`}>
                        {plot.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-semibold">{plot.size}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-primary">{formatCurrency(plot.price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="text-xs truncate max-w-[150px]">
                        {getProjectLocation(plot.projectId)}
                      </span>
                    </div>
                    <Badge variant="outline" className="w-full justify-center">
                      {plot.category}
                    </Badge>
                    <Button variant="secondary" size="sm" className="w-full mt-2">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">No plots found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or add new plots
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plot Details Modal */}
      <Dialog open={isPlotDetailsOpen} onOpenChange={setIsPlotDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Plot Details - {selectedPlot?.plotNumber}</DialogTitle>
            <DialogDescription>{getProjectName(selectedPlot?.projectId || "")}</DialogDescription>
          </DialogHeader>
          
          {selectedPlot && (
            <div className="space-y-6">
              {/* Plot Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plot Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Plot ID</Label>
                    <p className="font-semibold">{selectedPlot.plotNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Size</Label>
                    <p className="font-semibold">{selectedPlot.size}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Price</Label>
                    <p className="font-semibold text-primary">{formatCurrency(selectedPlot.price)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={`${getStatusBadgeColor(selectedPlot.status)} text-white mt-1`}>
                      {selectedPlot.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-semibold">{selectedPlot.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Facing</Label>
                    <p className="font-semibold">{selectedPlot.facing || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-semibold">{getProjectLocation(selectedPlot.projectId)}</p>
                  </div>
                  {selectedPlot.amenities && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Amenities</Label>
                      <p className="font-semibold">{selectedPlot.amenities}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary Statistics */}
              {plotStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Buyers</p>
                          <p className="text-2xl font-bold">{plotStats.totalInterestedBuyers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Offer</p>
                          <p className="text-2xl font-bold">
                            {plotStats.averageOfferedPrice > 0
                              ? formatCurrency(plotStats.averageOfferedPrice)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Highest Offer</p>
                          <p className="text-2xl font-bold">
                            {plotStats.highestOffer > 0 ? formatCurrency(plotStats.highestOffer) : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Interested Buyers */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Interested Buyers</CardTitle>
                    <Dialog open={isAddInterestOpen} onOpenChange={setIsAddInterestOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Interest
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Buyer Interest</DialogTitle>
                          <DialogDescription>Track a new buyer interested in this plot</DialogDescription>
                        </DialogHeader>
                        <Form {...buyerInterestForm}>
                          <form
                            onSubmit={buyerInterestForm.handleSubmit(handleBuyerInterestSubmit)}
                            className="space-y-4"
                          >
                            <FormField
                              control={buyerInterestForm.control}
                              name="buyerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Buyer Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buyerInterestForm.control}
                              name="buyerContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="9876543210" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buyerInterestForm.control}
                              name="buyerEmail"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buyerInterestForm.control}
                              name="offeredPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Offered Price (₹)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buyerInterestForm.control}
                              name="salespersonId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Assigned Salesperson</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select salesperson" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {salespersons?.map((sp: any) => (
                                        <SelectItem key={sp._id} value={sp._id}>
                                          {sp.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={buyerInterestForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Additional notes..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddInterestOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createBuyerInterestMutation.isPending}>
                                {createBuyerInterestMutation.isPending ? "Adding..." : "Add Interest"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {plotStats?.buyerInterests && plotStats.buyerInterests.length > 0 ? (
                    <div className="space-y-4">
                      {plotStats.buyerInterests.map((interest) => (
                        <Card key={interest._id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Buyer Name
                                </Label>
                                <p className="font-semibold">{interest.buyerName}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  Contact
                                </Label>
                                <p className="font-semibold">{interest.buyerContact}</p>
                              </div>
                              {interest.buyerEmail && (
                                <div>
                                  <Label className="text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                  </Label>
                                  <p className="font-semibold">{interest.buyerEmail}</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  Offered Price
                                </Label>
                                <p className="font-semibold text-green-600">
                                  {formatCurrency(interest.offeredPrice)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <Label className="text-muted-foreground">Salesperson Assigned</Label>
                                <p className="font-semibold">{interest.salespersonName}</p>
                              </div>
                              {interest.notes && (
                                <div className="col-span-2">
                                  <Label className="text-muted-foreground">Notes</Label>
                                  <p className="text-sm">{interest.notes}</p>
                                </div>
                              )}
                              <div className="col-span-2">
                                <Label className="text-muted-foreground">Inquiry Date</Label>
                                <p className="text-sm">
                                  {new Date(interest.createdAt).toLocaleDateString()} at{" "}
                                  {new Date(interest.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No buyer interests yet</p>
                      <p className="text-sm mt-1">Add buyer interests to track negotiations</p>
                    </div>
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
