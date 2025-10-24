import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Edit, Trash2, UserPlus, Eye, Repeat, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lead, User, InsertLead, Project, Plot, PopulatedUser } from "@shared/schema";
import { exportToCSV, exportToExcel } from "@/lib/csv-export";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, leadSources, leadStatuses, leadRatings } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [editPlotIds, setEditPlotIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: salespersons } = useQuery<User[]>({
    queryKey: ["/api/users/salespersons"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: plots } = useQuery<Plot[]>({
    queryKey: ["/api/plots"],
  });

  // Filter plots by selected project
  const filteredPlots = plots?.filter(plot => 
    selectedProjectId ? plot.projectId === selectedProjectId : true
  ) || [];
  
  // Filter plots for edit mode
  const editFilteredPlots = plots?.filter(plot => 
    editProjectId ? plot.projectId === editProjectId : true
  ) || [];

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "Website",
      status: "New",
      rating: "High",
      notes: "",
      projectId: "",
      plotIds: [],
      highestOffer: 0,
    },
  });

  const editForm = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      source: "Website",
      status: "New",
      rating: "High",
      notes: "",
      projectId: "",
      plotIds: [],
      assignedTo: "",
      highestOffer: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLead) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Lead created successfully" });
      setIsAddDialogOpen(false);
      setSelectedProjectId("");
      setSelectedPlotIds([]);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertLead }) =>
      apiRequest("PATCH", `/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/overview"] });
      toast({ title: "Lead updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedLead(null);
      setEditProjectId("");
      setEditPlotIds([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/leads/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ leadId, salespersonId }: { leadId: string; salespersonId: string }) =>
      apiRequest("PATCH", `/api/leads/${leadId}/assign`, { salespersonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead assigned successfully" });
      setIsAssignDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const transferMutation = useMutation({
    mutationFn: ({ leadId, salespersonId }: { leadId: string; salespersonId: string }) =>
      apiRequest("PATCH", `/api/leads/${leadId}/transfer`, { salespersonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({ title: "Lead transferred successfully" });
      setIsTransferDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked": return "bg-chart-3 text-white";
      case "Lost": return "bg-destructive text-white";
      case "Site Visit": return "bg-chart-2 text-foreground";
      case "Interested": return "bg-primary text-white";
      default: return "bg-secondary";
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Urgent": return "bg-chart-3 text-white";
      case "High": return "bg-chart-4 text-foreground";
      case "Low": return "bg-chart-1 text-foreground";
      default: return "bg-secondary";
    }
  };

  // Filter leads based on search and filters
  const baseFilteredLeads = leads?.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesRating = ratingFilter === "all" || lead.rating === ratingFilter;
    return matchesSearch && matchesStatus && matchesRating;
  });

  // Split leads for salespeople
  const myLeads = !isAdmin && user ? baseFilteredLeads?.filter((lead) => {
    const assignedToId = lead.assignedTo 
      ? (typeof lead.assignedTo === 'object' ? (lead.assignedTo as PopulatedUser)._id : lead.assignedTo)
      : null;
    return assignedToId === user._id;
  }) : [];

  const otherLeads = !isAdmin && user ? baseFilteredLeads?.filter((lead) => {
    const assignedToId = lead.assignedTo 
      ? (typeof lead.assignedTo === 'object' ? (lead.assignedTo as PopulatedUser)._id : lead.assignedTo)
      : null;
    return assignedToId !== user._id;
  }) : [];

  // For admins, show all filtered leads
  const filteredLeads = isAdmin ? baseFilteredLeads : baseFilteredLeads;

  const handleSubmit = (data: InsertLead) => {
    createMutation.mutate(data);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setEditProjectId(lead.projectId || "");
    setEditPlotIds(lead.plotIds || []);
    const assignedToId = lead.assignedTo 
      ? (typeof lead.assignedTo === 'object' ? (lead.assignedTo as PopulatedUser)._id : lead.assignedTo)
      : "";
    editForm.reset({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      rating: lead.rating,
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 16) : "",
      notes: lead.notes || "",
      projectId: lead.projectId || "",
      plotIds: lead.plotIds || [],
      assignedTo: assignedToId,
      highestOffer: lead.highestOffer || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setIsViewDialogOpen(true);
  };

  const handleUpdate = (data: InsertLead) => {
    if (selectedLead) {
      updateMutation.mutate({ id: selectedLead._id, data });
    }
  };

  const handleExportLeads = (exportFormat: "csv" | "excel") => {
    if (!filteredLeads || filteredLeads.length === 0) {
      alert("No leads to export");
      return;
    }

    const exportData = filteredLeads.map((lead) => ({
      "Name": lead.name,
      "Email": lead.email || "",
      "Phone": lead.phone,
      "Source": lead.source,
      "Status": lead.status,
      "Rating": lead.rating,
      "Assigned To": typeof lead.assignedTo === 'object' ? (lead.assignedTo as PopulatedUser).name : "",
      "Follow Up Date": lead.followUpDate ? format(new Date(lead.followUpDate), "dd/MM/yyyy") : "",
      "Highest Offer (₹)": lead.highestOffer || 0,
      "Notes": lead.notes || "",
      "Created At": format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm"),
    }));

    const filename = `leads-export-${new Date().toISOString().split('T')[0]}`;
    if (exportFormat === "csv") {
      exportToCSV(exportData, filename);
    } else {
      exportToExcel(exportData, filename);
    }
  };

  // Helper function to render leads table
  const renderLeadsTable = (leadsToRender: Lead[] | undefined, emptyMessage: string) => {
    if (!leadsToRender || leadsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Filter className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-lg font-medium text-foreground">No leads found</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsToRender.map((lead) => (
            <TableRow
              key={lead._id}
              className="hover-elevate"
              data-testid={`row-lead-${lead._id}`}
            >
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{lead.phone}</div>
                  {lead.email && <div className="text-muted-foreground">{lead.email}</div>}
                </div>
              </TableCell>
              <TableCell>{lead.source}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(lead.status)} data-testid={`badge-status-${lead._id}`}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getRatingColor(lead.rating)} data-testid={`badge-rating-${lead._id}`}>
                  {lead.rating}
                </Badge>
              </TableCell>
              <TableCell>
                {lead.followUpDate ? (
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(lead.followUpDate), "PP")}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {lead.assignedTo ? (
                  <span className="text-sm" data-testid={`text-assigned-to-${lead._id}`}>
                    {typeof lead.assignedTo === 'object' 
                      ? (lead.assignedTo as PopulatedUser).name 
                      : 'Assigned'}
                  </span>
                ) : (
                  isAdmin ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsAssignDialogOpen(true);
                      }}
                      data-testid={`button-assign-${lead._id}`}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleView(lead)}
                    data-testid={`button-view-${lead._id}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  {!isAdmin && lead.assignedTo && String(typeof lead.assignedTo === 'object' ? (lead.assignedTo as PopulatedUser)._id : lead.assignedTo) === user?._id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsTransferDialogOpen(true);
                      }}
                      data-testid={`button-transfer-${lead._id}`}
                    >
                      <Repeat className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(lead)}
                    data-testid={`button-edit-${lead._id}`}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(lead._id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${lead._id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your leads</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="button-export-leads">
                <Download className="h-4 w-4 mr-2" />
                Export Leads
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExportLeads("csv")} data-testid="menu-export-leads-csv">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportLeads("excel")} data-testid="menu-export-leads-excel">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-lead">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Create a new lead entry in the system</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-lead-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} data-testid="input-lead-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-lead-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-source">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadSources.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadStatuses.map((status) => (
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
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-rating">
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leadRatings.map((rating) => (
                              <SelectItem key={rating} value={rating}>
                                {rating}
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
                  control={form.control}
                  name="followUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-lead-followup" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes..."
                          {...field}
                          data-testid="input-lead-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Salesperson Assignment for all users */}
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Salesperson (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lead-salesperson">
                            <SelectValue placeholder="Select a salesperson" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {salespersons?.map((sp) => (
                            <SelectItem key={sp._id} value={sp._id}>
                              {sp.name} ({sp.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Project Interest (Optional)</h3>
                  
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedProjectId(value);
                            setSelectedPlotIds([]);
                            form.setValue("plotIds", []);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-lead-project">
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project._id} value={project._id}>
                                {project.name} - {project.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedProjectId && (
                    <>
                      <FormField
                        control={form.control}
                        name="plotIds"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Select Plots</FormLabel>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                              {filteredPlots.map((plot) => (
                                <div key={plot._id} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={field.value?.includes(plot._id)}
                                    onCheckedChange={(checked) => {
                                      const updatedPlots = checked
                                        ? [...(field.value || []), plot._id]
                                        : (field.value || []).filter((id) => id !== plot._id);
                                      field.onChange(updatedPlots);
                                      setSelectedPlotIds(updatedPlots);
                                    }}
                                    data-testid={`checkbox-plot-${plot._id}`}
                                  />
                                  <Label className="text-sm font-normal cursor-pointer">
                                    {plot.plotNumber} ({plot.size}) - ₹{plot.price.toLocaleString()}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="highestOffer"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Highest Offer (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter amount" 
                                {...field}
                                data-testid="input-lead-offer" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setSelectedProjectId("");
                      setSelectedPlotIds([]);
                    }}
                    data-testid="button-cancel-lead"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-lead">
                    {createMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-leads"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {leadStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-filter-rating">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {leadRatings.map((rating) => (
              <SelectItem key={rating} value={rating}>
                {rating}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Admin View - Single Table */}
      {isAdmin ? (
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            renderLeadsTable(filteredLeads, "Try adjusting your filters or add a new lead")
          )}
        </div>
      ) : (
        /* Salesperson View - Tabbed Interface */
        <Tabs defaultValue="my-leads" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-leads" data-testid="tab-my-leads">
              My Leads ({myLeads?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="other-leads" data-testid="tab-other-leads">
              Other Leads ({otherLeads?.length || 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-leads" className="mt-4">
            <div className="rounded-lg border border-border bg-card">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderLeadsTable(myLeads, "You don't have any assigned leads yet")
              )}
            </div>
          </TabsContent>
          <TabsContent value="other-leads" className="mt-4">
            <div className="rounded-lg border border-border bg-card">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderLeadsTable(otherLeads, "No other leads available")
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>View complete information about this lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="text-foreground font-medium">{selectedLead.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="text-foreground font-medium">{selectedLead.phone}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-foreground font-medium">{selectedLead.email || "N/A"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Source</Label>
                  <p className="text-foreground font-medium">{selectedLead.source}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedLead.status)}>{selectedLead.status}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Rating</Label>
                  <Badge className={getRatingColor(selectedLead.rating)}>{selectedLead.rating}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Follow-up Date</Label>
                <p className="text-foreground font-medium">
                  {selectedLead.followUpDate
                    ? format(new Date(selectedLead.followUpDate), "PPP")
                    : "Not scheduled"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-foreground font-medium">{selectedLead.notes || "No notes"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Assigned To</Label>
                  <p className="text-foreground font-medium">
                    {selectedLead.assignedTo 
                      ? (typeof selectedLead.assignedTo === 'object' 
                        ? (selectedLead.assignedTo as PopulatedUser).name 
                        : 'Assigned')
                      : 'Unassigned'}
                  </p>
                </div>
                {selectedLead.assignedBy && (
                  <div>
                    <Label className="text-muted-foreground">Transferred By</Label>
                    <p className="text-foreground font-medium">
                      {typeof selectedLead.assignedBy === 'object' 
                        ? (selectedLead.assignedBy as PopulatedUser).name 
                        : 'Transferred'}
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="text-foreground font-medium">
                    {format(new Date(selectedLead.createdAt), "PPP")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated At</Label>
                  <p className="text-foreground font-medium">
                    {format(new Date(selectedLead.updatedAt), "PPP")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-edit-lead-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} data-testid="input-edit-lead-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} data-testid="input-edit-lead-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lead-source">
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadSources.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lead-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadStatuses.map((status) => (
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
                <FormField
                  control={editForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lead-rating">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leadRatings.map((rating) => (
                            <SelectItem key={rating} value={rating}>
                              {rating}
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
                control={editForm.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} data-testid="input-edit-lead-followup" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isAdmin && (
                <FormField
                  control={editForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Salesperson (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-lead-salesperson">
                            <SelectValue placeholder="Not assigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {salespersons?.map((sp) => (
                            <SelectItem key={sp._id} value={sp._id}>
                              {sp.name} ({sp.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={editForm.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setEditProjectId(value);
                        setEditPlotIds([]);
                        editForm.setValue("plotIds", []);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-lead-project">
                          <SelectValue placeholder="No project selected" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name} - {project.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editProjectId && editFilteredPlots.length > 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Select Plots (Optional)</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
                      {editFilteredPlots.map((plot) => (
                        <div key={plot._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-plot-${plot._id}`}
                            checked={editPlotIds.includes(plot._id)}
                            onCheckedChange={(checked) => {
                              const newPlotIds = checked
                                ? [...editPlotIds, plot._id]
                                : editPlotIds.filter((id) => id !== plot._id);
                              setEditPlotIds(newPlotIds);
                              editForm.setValue("plotIds", newPlotIds);
                            }}
                            data-testid={`checkbox-edit-plot-${plot._id}`}
                          />
                          <label
                            htmlFor={`edit-plot-${plot._id}`}
                            className="text-sm cursor-pointer"
                          >
                            Plot #{plot.plotNumber} - {plot.size} - ₹{plot.price.toLocaleString()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={editForm.control}
                    name="highestOffer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highest Offer (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            {...field}
                            data-testid="input-edit-lead-offer" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        {...field}
                        data-testid="input-edit-lead-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit-lead"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit-lead">
                  {updateMutation.isPending ? "Updating..." : "Update Lead"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Assign {selectedLead?.name} to a salesperson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Salesperson</Label>
              <Select
                onValueChange={(value) => {
                  if (selectedLead) {
                    assignMutation.mutate({
                      leadId: selectedLead._id,
                      salespersonId: value,
                    });
                  }
                }}
              >
                <SelectTrigger data-testid="select-salesperson">
                  <SelectValue placeholder="Choose a salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons?.map((sp) => (
                    <SelectItem key={sp._id} value={sp._id}>
                      {sp.name} ({sp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Lead</DialogTitle>
            <DialogDescription>
              Transfer {selectedLead?.name} to another salesperson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Salesperson</Label>
              <Select
                onValueChange={(value) => {
                  if (selectedLead) {
                    transferMutation.mutate({
                      leadId: selectedLead._id,
                      salespersonId: value,
                    });
                  }
                }}
              >
                <SelectTrigger data-testid="select-transfer-salesperson">
                  <SelectValue placeholder="Choose a salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespersons?.filter(sp => sp._id !== user?._id).map((sp) => (
                    <SelectItem key={sp._id} value={sp._id}>
                      {sp.name} ({sp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
