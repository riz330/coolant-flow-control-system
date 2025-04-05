
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Edit, Trash2, Plus, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Define the Distributor interface
interface Distributor {
  distributor_id: number;
  distributor_name: string;
  city: string;
  address: string;
  primary_contact_person: string;
  primary_number: string;
  secondary_contact_person: string | null;
  secondary_number: string | null;
  email_id: string;
  gst_number: string;
  distributor_category: string;
  whatsapp_number: string;
  distributor_logo: string | null;
  created_by: number;
}

// Define QR Code Data interface
interface QRCodeData {
  id: number;
  name: string;
  city: string;
  email: string;
  gst: string;
}

// Form schema validation
const distributorFormSchema = z.object({
  distributor_name: z.string().min(1, "Distributor name is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  primary_contact_person: z.string().min(1, "Primary contact person is required"),
  primary_country_code: z.string().default("+91"),
  primary_mobile_number: z
    .string()
    .min(10, "Mobile number must be 10 digits")
    .max(10, "Mobile number must be 10 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  secondary_contact_person: z.string().optional(),
  secondary_country_code: z.string().default("+91"),
  secondary_mobile_number: z
    .string()
    .regex(/^\d*$/, "Mobile number must contain only digits")
    .max(10, "Mobile number must be 10 digits")
    .optional(),
  email_id: z.string().email("Invalid email address"),
  gst_number: z.string().min(1, "GST number is required"),
  distributor_category: z.string().min(1, "Category is required"),
  whatsapp_country_code: z.string().default("+91"),
  whatsapp_communication_number: z
    .string()
    .min(10, "WhatsApp number must be 10 digits")
    .max(10, "WhatsApp number must be 10 digits")
    .regex(/^\d+$/, "WhatsApp number must contain only digits"),
});

type DistributorFormValues = z.infer<typeof distributorFormSchema>;

const DistributorManagement: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isQRCodeOpen, setIsQRCodeOpen] = useState<boolean>(false);
  const [editingDistributor, setEditingDistributor] = useState<Distributor | null>(null);
  const [distributorToDelete, setDistributorToDelete] = useState<number | null>(null);
  const [qrCodeData, setQRCodeData] = useState<QRCodeData | null>(null);
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Form
  const form = useForm<DistributorFormValues>({
    resolver: zodResolver(distributorFormSchema),
    defaultValues: {
      distributor_name: "",
      city: "",
      address: "",
      primary_contact_person: "",
      primary_country_code: "+91",
      primary_mobile_number: "",
      secondary_contact_person: "",
      secondary_country_code: "+91",
      secondary_mobile_number: "",
      email_id: "",
      gst_number: "",
      distributor_category: "",
      whatsapp_country_code: "+91",
      whatsapp_communication_number: "",
    },
  });
  
  // Fetch distributors with filters
  const fetchDistributors = async () => {
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/distributors?page=${currentPage}&per_page=10`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      
      if (selectedCity) {
        url += `&city=${encodeURIComponent(selectedCity)}`;
      }
      
      const token = localStorage.getItem("token");
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch distributors");
      }
      
      const data = await response.json();
      setDistributors(data.distributors);
      setTotalPages(data.total_pages);
      setCategories(data.categories);
      setCities(data.cities);
    } catch (error) {
      console.error("Error fetching distributors:", error);
      toast({
        title: "Error",
        description: "Failed to load distributors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch single distributor for editing
  const fetchDistributor = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/distributor/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch distributor details");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching distributor:", error);
      toast({
        title: "Error",
        description: "Failed to load distributor details.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Generate QR Code data
  const fetchQRCodeData = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/distributor/qrcode/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate QR code");
      }
      
      const data = await response.json();
      setQRCodeData(data.distributor_data);
      setIsQRCodeOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      });
    }
  };
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size exceeds the 2MB limit.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      
      // Check file type
      const fileType = file.type.toLowerCase();
      if (!fileType.includes('jpeg') && !fileType.includes('jpg') && !fileType.includes('png')) {
        toast({
          title: "Error",
          description: "Only JPG, JPEG, and PNG files are allowed.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }
      
      setSelectedFile(file);
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Open add/edit form
  const openDistributorForm = async (distributor?: Distributor) => {
    if (distributor) {
      const distributorDetails = await fetchDistributor(distributor.distributor_id);
      if (distributorDetails) {
        setEditingDistributor(distributorDetails);
        form.reset({
          distributor_name: distributorDetails.distributor_name,
          city: distributorDetails.city,
          address: distributorDetails.address,
          primary_contact_person: distributorDetails.primary_contact_person,
          primary_country_code: distributorDetails.primary_country_code,
          primary_mobile_number: distributorDetails.primary_mobile_number,
          secondary_contact_person: distributorDetails.secondary_contact_person || "",
          secondary_country_code: distributorDetails.secondary_country_code,
          secondary_mobile_number: distributorDetails.secondary_mobile_number || "",
          email_id: distributorDetails.email_id,
          gst_number: distributorDetails.gst_number,
          distributor_category: distributorDetails.distributor_category,
          whatsapp_country_code: distributorDetails.whatsapp_country_code,
          whatsapp_communication_number: distributorDetails.whatsapp_communication_number,
        });
        
        if (distributorDetails.distributor_logo) {
          setPreviewUrl(`${import.meta.env.VITE_API_URL}${distributorDetails.distributor_logo}`);
        } else {
          setPreviewUrl(null);
        }
      }
    } else {
      setEditingDistributor(null);
      form.reset();
      setPreviewUrl(null);
      setSelectedFile(null);
    }
    
    setIsFormOpen(true);
  };
  
  // Submit form handler
  const onSubmit = async (data: DistributorFormValues) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('distributor_logo', selectedFile);
      }
      
      let url = `${import.meta.env.VITE_API_URL}/api/distributors`;
      let method = 'POST';
      
      if (editingDistributor) {
        url = `${import.meta.env.VITE_API_URL}/api/distributor/${editingDistributor.distributor_id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save distributor");
      }
      
      toast({
        title: "Success",
        description: editingDistributor 
          ? "Distributor updated successfully" 
          : "Distributor added successfully",
      });
      
      setIsFormOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error("Error saving distributor:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save distributor",
        variant: "destructive",
      });
    }
  };
  
  // Delete distributor
  const handleDelete = async () => {
    if (!distributorToDelete) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/distributor/${distributorToDelete}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete distributor");
      }
      
      toast({
        title: "Success",
        description: "Distributor deleted successfully",
      });
      
      fetchDistributors();
    } catch (error) {
      console.error("Error deleting distributor:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete distributor",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDistributorToDelete(null);
    }
  };
  
  // Check if user has permission for actions
  const canEdit = (distributor: Distributor) => {
    if (!user) return false;
    return user.role === "Admin" || distributor.created_by === user.id || user.role === "Manager";
  };
  
  const canDelete = () => {
    if (!user) return false;
    return user.role === "Admin";
  };
  
  const canAdd = () => {
    if (!user) return false;
    return ["Admin", "Manager", "Employee"].includes(user.role);
  };
  
  // Effect hooks
  useEffect(() => {
    fetchDistributors();
  }, [currentPage, searchTerm, selectedCategory, selectedCity]);
  
  // Render QR Code
  const renderQRCode = () => {
    if (!qrCodeData) return null;
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      JSON.stringify({
        id: qrCodeData.id,
        name: qrCodeData.name,
        city: qrCodeData.city,
        email: qrCodeData.email,
        gst: qrCodeData.gst
      })
    )}`;
    
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <img src={qrCodeUrl} alt="Distributor QR Code" className="w-48 h-48 mb-4" />
        <div className="text-center space-y-1">
          <p className="font-semibold text-lg">{qrCodeData.name}</p>
          <p>{qrCodeData.city}</p>
          <p>{qrCodeData.email}</p>
          <p>GST: {qrCodeData.gst}</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Distributor Management</h1>
      
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search by name, city, or GST..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Add Button */}
        {canAdd() && (
          <Button onClick={() => openDistributorForm()} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Distributor
          </Button>
        )}
      </div>
      
      {/* Table */}
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">S.No</TableHead>
              <TableHead>Distributor Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Primary Contact</TableHead>
              <TableHead>Primary Mobile</TableHead>
              <TableHead>Secondary Contact</TableHead>
              <TableHead>Secondary Mobile</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>WhatsApp Number</TableHead>
              <TableHead>Logo</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : distributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8">
                  No distributors found.
                </TableCell>
              </TableRow>
            ) : (
              distributors.map((distributor, index) => (
                <TableRow key={distributor.distributor_id}>
                  <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                  <TableCell className="font-medium">{distributor.distributor_name}</TableCell>
                  <TableCell>{distributor.city}</TableCell>
                  <TableCell>{distributor.address}</TableCell>
                  <TableCell>{distributor.primary_contact_person}</TableCell>
                  <TableCell>{distributor.primary_number}</TableCell>
                  <TableCell>{distributor.secondary_contact_person || '-'}</TableCell>
                  <TableCell>{distributor.secondary_number || '-'}</TableCell>
                  <TableCell>{distributor.email_id}</TableCell>
                  <TableCell>{distributor.gst_number}</TableCell>
                  <TableCell>{distributor.distributor_category}</TableCell>
                  <TableCell>{distributor.whatsapp_number}</TableCell>
                  <TableCell>
                    {distributor.distributor_logo ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${distributor.distributor_logo}`} 
                        alt={distributor.distributor_name} 
                        className="w-10 h-10 object-cover rounded-md" 
                      />
                    ) : (
                      <span>No logo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchQRCodeData(distributor.distributor_id)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    
                    {canEdit(distributor) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDistributorForm(distributor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canDelete() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDistributorToDelete(distributor.distributor_id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Add/Edit Distributor Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDistributor ? "Edit Distributor" : "Add New Distributor"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Distributor Name */}
                <FormField
                  control={form.control}
                  name="distributor_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distributor Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter distributor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* City */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Primary Contact Person */}
                <FormField
                  control={form.control}
                  name="primary_contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Contact Person *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter primary contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Primary Mobile Number */}
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="primary_country_code"
                    render={({ field }) => (
                      <FormItem className="w-1/4">
                        <FormLabel>Code *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="+91" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+91">+91</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primary_mobile_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Primary Mobile Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit mobile number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Secondary Contact Person */}
                <FormField
                  control={form.control}
                  name="secondary_contact_person"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Contact Person</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter secondary contact person" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Secondary Mobile Number */}
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="secondary_country_code"
                    render={({ field }) => (
                      <FormItem className="w-1/4">
                        <FormLabel>Code</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="+91" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+91">+91</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secondary_mobile_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Secondary Mobile Number</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit mobile number (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email ID *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* GST Number */}
                <FormField
                  control={form.control}
                  name="gst_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter GST number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Distributor Category */}
                <FormField
                  control={form.control}
                  name="distributor_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distributor Category *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Wholesale">Wholesale</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Industrial">Industrial</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* WhatsApp Number */}
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="whatsapp_country_code"
                    render={({ field }) => (
                      <FormItem className="w-1/4">
                        <FormLabel>Code *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="+91" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="+91">+91</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp_communication_number"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="10-digit WhatsApp number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <Label htmlFor="logo">Distributor Logo</Label>
                  <div className="flex flex-col md:flex-row gap-4 items-start mt-2">
                    <Input
                      id="logo"
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    {previewUrl && (
                      <div className="flex flex-col items-center">
                        <img
                          src={previewUrl}
                          alt="Logo Preview"
                          className="w-24 h-24 object-cover rounded border border-gray-300"
                        />
                        <span className="text-sm text-gray-500 mt-1">Preview</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Max size: 2MB. Formats: PNG, JPG.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDistributor ? "Update" : "Add"} Distributor
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this distributor and remove their logo file from the server.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQRCodeOpen} onOpenChange={setIsQRCodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Distributor QR Code</DialogTitle>
          </DialogHeader>
          {renderQRCode()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributorManagement;
