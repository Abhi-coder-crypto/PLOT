import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Building2, DollarSign, Maximize, Compass, Package } from "lucide-react";
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
import type { Plot, Project, InsertPlot, InsertProject, Lead, InsertPayment } from "@shared/schema";
import { plotStatuses, paymentModes, bookingTypes } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlotSchema, insertProjectSchema, insertPaymentSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth";

export default function Plots() {
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddPlotOpen, setIsAddPlotOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: plots, isLoading: plotsLoading } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
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
    },
  });

  const bookingForm = useForm<InsertPayment>({
    resolver: zodResolver(insertPaymentSchema),
    defaultValues: {
      leadId: "",
      plotId: "",
      amount: 0,
      mode: "Cash",
      bookingType: "Token",
      transactionId: "",
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

  const createBookingMutation = useMutation({
    mutationFn: (data: InsertPayment) => apiRequest("POST", "/api/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Booking created successfully" });
      setIsBookingOpen(false);
      setSelectedPlot(null);
      bookingForm.reset();
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

  const handleBookingSubmit = (data: InsertPayment) => {
    if (selectedPlot) {
      createBookingMutation.mutate({
        ...data,
        plotId: selectedPlot._id,
      });
    }
  };

  const getPlotColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-chart-3 hover:bg-chart-3/80 text-white";
      case "Booked": return "bg-chart-2 hover:bg-chart-2/80 text-foreground";
      case "Hold": return "bg-accent hover:bg-accent/80 text-accent-foreground";
      case "Sold": return "bg-destructive hover:bg-destructive/80 text-white";
      default: return "bg-secondary hover:bg-secondary/80";
    }
  };

  const filteredPlots = selectedProject
    ? plots?.filter((plot) => plot.projectId === selectedProject)
    : plots;

  const bookedLeads = leads?.filter((lead) => lead.status === "Booked") || [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects & Plots</h1>
          <p className="text-muted-foreground mt-1">Manage your real estate inventory</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="button-add-project">
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
                                data-testid="input-project-plots"
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddProjectOpen(false)}
                          data-testid="button-cancel-project"
                        >
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
                  <Button data-testid="button-add-plot">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Plot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Plot</DialogTitle>
                    <DialogDescription>Add a plot to a project</DialogDescription>
                  </DialogHeader>
                  <Form {...plotForm}>
                    <form onSubmit={plotForm.handleSubmit(handlePlotSubmit)} className="space-y-4">
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
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddPlotOpen(false)}
                          data-testid="button-cancel-plot"
                        >
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
      </motion.div>

      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grid" data-testid="tab-grid">Plot Grid</TabsTrigger>
          <TabsTrigger value="projects" data-testid="tab-projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          {projects && projects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedProject === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProject(null)}
                data-testid="button-all-projects"
              >
                All Projects
              </Button>
              {projects.map((project) => (
                <Button
                  key={project._id}
                  variant={selectedProject === project._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProject(project._id)}
                  data-testid={`button-project-${project._id}`}
                >
                  {project.name}
                </Button>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Plot Status</CardTitle>
                  <CardDescription>Color-coded plot availability</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-chart-3 text-white">Available</Badge>
                  <Badge className="bg-chart-2 text-foreground">Booked</Badge>
                  <Badge className="bg-accent text-accent-foreground">Hold</Badge>
                  <Badge className="bg-destructive text-white">Sold</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {plotsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredPlots && filteredPlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredPlots.map((plot, index) => (
                    <motion.button
                      key={plot._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => {
                        if (plot.status === "Available" || plot.status === "Hold") {
                          setSelectedPlot(plot);
                          setIsBookingOpen(true);
                          bookingForm.setValue("plotId", plot._id);
                        }
                      }}
                      className={`p-4 rounded-lg border-2 border-transparent transition-all ${getPlotColor(plot.status)} active-elevate-2`}
                      data-testid={`plot-${plot._id}`}
                      disabled={plot.status === "Sold" || plot.status === "Booked"}
                    >
                      <div className="text-sm font-semibold">{plot.plotNumber}</div>
                      <div className="text-xs opacity-90 mt-1">{plot.size}</div>
                      <div className="text-xs font-medium mt-1">₹{(plot.price / 100000).toFixed(1)}L</div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-lg font-medium text-foreground">No plots available</p>
                  <p className="text-sm text-muted-foreground mt-1">Add plots to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {projectsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover-elevate" data-testid={`card-project-${project._id}`}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                          <CardDescription className="truncate">{project.location}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Total Plots</span>
                        <Badge>{project.totalPlots}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm text-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-lg font-medium text-foreground">No projects found</p>
              <p className="text-sm text-muted-foreground mt-1">Create a project to get started</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Plot</DialogTitle>
            <DialogDescription>
              Book plot {selectedPlot?.plotNumber} - {selectedPlot?.size}
            </DialogDescription>
          </DialogHeader>
          <Form {...bookingForm}>
            <form onSubmit={bookingForm.handleSubmit(handleBookingSubmit)} className="space-y-4">
              <FormField
                control={bookingForm.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Lead</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-booking-lead">
                          <SelectValue placeholder="Choose a lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bookedLeads.map((lead) => (
                          <SelectItem key={lead._id} value={lead._id}>
                            {lead.name} ({lead.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={bookingForm.control}
                  name="bookingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-booking-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bookingTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={bookingForm.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-mode">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentModes.map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={bookingForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-booking-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bookingForm.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="TXN123456" {...field} data-testid="input-transaction-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bookingForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional notes" {...field} data-testid="input-booking-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsBookingOpen(false);
                    setSelectedPlot(null);
                  }}
                  data-testid="button-cancel-booking"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createBookingMutation.isPending} data-testid="button-submit-booking">
                  {createBookingMutation.isPending ? "Booking..." : "Book Plot"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
