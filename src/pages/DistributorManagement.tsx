import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { useMobile } from "@/hooks/use-mobile";
import { Layout } from "@/components/layout/Layout";
import { useDebounce } from "@/hooks/use-debounce";
import { QrCode, Search } from "lucide-react";

// Define the interface for distributor
interface Distributor {
  distributor_id: number;
  distributor_name: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  website: string | null;
  primary_contact_person: string;
  primary_country_code: string;
  primary_mobile_number: string;
  secondary_contact_person: string | null;
  secondary_country_code: string | null;
  secondary_mobile_number: string | null;
  email_id: string;
  gst_number: string;
  distributor_category: string;
  whatsapp_country_code: string;
  whatsapp_communication_number: string;
  distributor_logo: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
}

type DistributorFormData = Omit<Distributor, 'distributor_id' | 'created_by' | 'created_at' | 'updated_at'>;

const DistributorManagement = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  
  // States for the distributors and form
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;
  
  // Form data
  const [formData, setFormData] = useState<DistributorFormData>({
    distributor_name: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    website: "",
    primary_contact_person: "",
    primary_country_code: "+91", // Default value
    primary_mobile_number: "",
    secondary_contact_person: "",
    secondary_country_code: "",
    secondary_mobile_number: "",
    email_id: "",
    gst_number: "",
    distributor_category: "",
    whatsapp_country_code: "+91", // Default value
    whatsapp_communication_number: "",
    distributor_logo: null
  });
  
  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Fetch functions for initial data load
  const fetchDistributors = async () => {
    try {
      const response = await fetch('/api/distributors/');
      const data = await response.json();
      
      if (data.success) {
        setDistributors(data.distributors);
        calculateTotalPages(data.distributors.length);
      } else {
        toast.error(data.error || "Failed to load distributors");
      }
    } catch (error) {
      console.error("Error fetching distributors:", error);
      toast.error("Failed to fetch distributors");
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/distributors/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  
  const fetchCities = async () => {
    try {
      const response = await fetch('/api/distributors/cities');
      const data = await response.json();
      
      if (data.success) {
        setCities(data.cities);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };
  
  const fetchStates = async () => {
    try {
      const response = await fetch('/api/distributors/states');
      const data = await response.json();
      
      if (data.success) {
        setStates(data.states);
      }
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchDistributors();
    fetchCategories();
    fetchCities();
    fetchStates();
  }, []);
  
  // Filter distributors based on search and filters
  useEffect(() => {
    // If no filters and no search, fetch all distributors
    if (!debouncedSearchTerm && !categoryFilter && !cityFilter && !stateFilter) {
      fetchDistributors();
      return;
    }
    
    // Otherwise filter the distributors
    const fetchFilteredDistributors = async () => {
      try {
        // Build query string for filters
        const queryParams = new URLSearchParams();
        
        if (debouncedSearchTerm) {
          queryParams.append('search', debouncedSearchTerm);
        }
        
        if (categoryFilter) {
          queryParams.append('category', categoryFilter);
        }
        
        if (cityFilter) {
          queryParams.append('city', cityFilter);
        }
        
        if (stateFilter) {
          queryParams.append('state', stateFilter);
        }
        
        // Fetch filtered distributors
        const response = await fetch(`/api/distributors/?${queryParams.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setDistributors(data.distributors);
          calculateTotalPages(data.distributors.length);
        } else {
          toast.error(data.error || "Failed to load filtered distributors");
        }
      } catch (error) {
        console.error("Error fetching filtered distributors:", error);
        toast.error("Failed to fetch filtered distributors");
      }
    };
    
    fetchFilteredDistributors();
  }, [debouncedSearchTerm, categoryFilter, cityFilter, stateFilter]);
  
  // Calculate total pages
  const calculateTotalPages = (totalRecords: number) => {
    setTotalPages(Math.ceil(totalRecords / recordsPerPage));
  };
  
  // Get current distributors for pagination
  const getCurrentDistributors = () => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return distributors.slice(indexOfFirstRecord, indexOfLastRecord);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for GST to convert to uppercase
    if (name === 'gst_number') {
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit");
        return;
      }
      
      // Check file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error("Only PNG, JPG, and JPEG images are allowed");
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Open form for adding a new distributor
  const handleAddDistributor = () => {
    setFormData({
      distributor_name: "",
      city: "",
      state: "",
      pincode: "",
      address: "",
      website: "",
      primary_contact_person: "",
      primary_country_code: "+91",
      primary_mobile_number: "",
      secondary_contact_person: "",
      secondary_country_code: "",
      secondary_mobile_number: "",
      email_id: "",
      gst_number: "",
      distributor_category: "",
      whatsapp_country_code: "+91",
      whatsapp_communication_number: "",
      distributor_logo: null
    });
    setLogoFile(null);
    setLogoPreview(null);
    setSelectedDistributor(null);
    setIsFormOpen(true);
  };
  
  // Open form for editing a distributor
  const handleEditDistributor = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setFormData({
      distributor_name: distributor.distributor_name,
      city: distributor.city,
      state: distributor.state,
      pincode: distributor.pincode,
      address: distributor.address,
      website: distributor.website || "",
      primary_contact_person: distributor.primary_contact_person,
      primary_country_code: distributor.primary_country_code,
      primary_mobile_number: distributor.primary_mobile_number,
      secondary_contact_person: distributor.secondary_contact_person || "",
      secondary_country_code: distributor.secondary_country_code || "",
      secondary_mobile_number: distributor.secondary_mobile_number || "",
      email_id: distributor.email_id,
      gst_number: distributor.gst_number,
      distributor_category: distributor.distributor_category,
      whatsapp_country_code: distributor.whatsapp_country_code,
      whatsapp_communication_number: distributor.whatsapp_communication_number,
      distributor_logo: distributor.distributor_logo
    });
    setLogoPreview(distributor.distributor_logo);
    setIsFormOpen(true);
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setIsDeleteDialogOpen(true);
  };
  
  // Open QR code dialog
  const handleQrCodeClick = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setIsQrDialogOpen(true);
  };
  
  // Submit form to add or update distributor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.distributor_name || !formData.city || !formData.state || 
        !formData.pincode || !formData.address || !formData.primary_contact_person || 
        !formData.primary_country_code || !formData.primary_mobile_number || 
        !formData.email_id || !formData.gst_number || !formData.distributor_category || 
        !formData.whatsapp_country_code || !formData.whatsapp_communication_number) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_id)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // Validate GST format (15 characters alphanumeric)
    const gstRegex = /^[0-9A-Z]{15}$/;
    if (!gstRegex.test(formData.gst_number)) {
      toast.error("GST Number must be 15 alphanumeric characters");
      return;
    }
    
    // Validate mobile numbers (10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.primary_mobile_number)) {
      toast.error("Primary Mobile Number must be 10 digits");
      return;
    }
    
    if (formData.secondary_mobile_number && !mobileRegex.test(formData.secondary_mobile_number)) {
      toast.error("Secondary Mobile Number must be 10 digits");
      return;
    }
    
    if (!mobileRegex.test(formData.whatsapp_communication_number)) {
      toast.error("WhatsApp Number must be 10 digits");
      return;
    }
    
    // Validate website format if provided
    if (formData.website && formData.website.trim() !== "") {
      const websiteRegex = /^(http:\/\/|https:\/\/)/;
      if (!websiteRegex.test(formData.website)) {
        toast.error("Website URL must start with http:// or https://");
        return;
      }
    }
    
    // Create FormData object for file upload
    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        formPayload.append(key, value.toString());
      }
    });
    
    // Add file if selected
    if (logoFile) {
      formPayload.append('distributor_logo', logoFile);
    }
    
    // Add created_by if adding new distributor
    if (!selectedDistributor && user) {
      formPayload.append('created_by', user.user_id.toString());
    }
    
    try {
      let response;
      
      if (selectedDistributor) {
        // Update existing distributor
        response = await fetch(`/api/distributors/${selectedDistributor.distributor_id}`, {
          method: 'PUT',
          body: formPayload,
        });
      } else {
        // Create new distributor
        response = await fetch('/api/distributors/', {
          method: 'POST',
          body: formPayload,
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchDistributors(); // Refresh list
        setIsFormOpen(false);
      } else {
        toast.error(data.error || "Failed to save distributor");
      }
    } catch (error) {
      console.error("Error saving distributor:", error);
      toast.error("Failed to save distributor");
    }
  };
  
  // Delete a distributor
  const handleDeleteConfirm = async () => {
    if (!selectedDistributor) return;
    
    try {
      const response = await fetch(`/api/distributors/${selectedDistributor.distributor_id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        fetchDistributors(); // Refresh list
      } else {
        toast.error(data.error || "Failed to delete distributor");
      }
    } catch (error) {
      console.error("Error deleting distributor:", error);
      toast.error("Failed to delete distributor");
    }
    
    setIsDeleteDialogOpen(false);
  };
  
  // Check if user has permission to perform certain actions
  const hasEditPermission = () => {
    return user && ['Admin', 'Manager'].includes(user.role);
  };
  
  const hasAddPermission = () => {
    return user && ['Admin', 'Manager', 'Employee'].includes(user.role);
  };
  
  const hasDeletePermission = () => {
    return user && user.role === 'Admin';
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Distributor Management</CardTitle>
            <CardDescription>Manage all distributors from this dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              {/* Search box */}
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, city, GST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="Category" />
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
                
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="City" />
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
                
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All States</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Add button */}
              {hasAddPermission() && (
                <Button onClick={handleAddDistributor} className="w-full md:w-auto">
                  Add Distributor
                </Button>
              )}
            </div>
            
            {/* Distributors table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Distributor Name</TableHead>
                    <TableHead className="hidden md:table-cell">City</TableHead>
                    <TableHead className="hidden md:table-cell">State</TableHead>
                    <TableHead className="hidden md:table-cell">GST Number</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getCurrentDistributors().map((distributor, index) => (
                    <TableRow key={distributor.distributor_id}>
                      <TableCell>
                        {(currentPage - 1) * recordsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{distributor.distributor_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{distributor.city}</TableCell>
                      <TableCell className="hidden md:table-cell">{distributor.state}</TableCell>
                      <TableCell className="hidden md:table-cell">{distributor.gst_number}</TableCell>
                      <TableCell className="hidden md:table-cell">{distributor.distributor_category}</TableCell>
                      <TableCell>
                        {distributor.primary_country_code} {distributor.primary_mobile_number}
                      </TableCell>
                      <TableCell>
                        {distributor.distributor_logo ? (
                          <img 
                            src={distributor.distributor_logo} 
                            alt={distributor.distributor_name}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            {distributor.distributor_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {hasEditPermission() && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEditDistributor(distributor)}
                            >
                              ✏️
                            </Button>
                          )}
                          
                          {hasDeletePermission() && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteClick(distributor)}
                              className="text-red-500"
                            >
                              🗑️
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleQrCodeClick(distributor)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {distributors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No distributors found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {distributors.length > 0 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <PaginationItem key={index}>
                      <Button
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </Button>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add/Edit Distributor Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDistributor ? "Edit Distributor" : "Add New Distributor"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distributor Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="distributor_name">Distributor Name *</Label>
                <Input
                  id="distributor_name"
                  name="distributor_name"
                  value={formData.distributor_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distributor_category">Distributor Category *</Label>
                <Select 
                  value={formData.distributor_category}
                  onValueChange={(value) => handleSelectChange('distributor_category', value)}
                >
                  <SelectTrigger id="distributor_category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  type="text"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number *</Label>
                <Input
                  id="gst_number"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  required
                  maxLength={15}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              
              {/* Contact Information */}
              <div className="space-y-2">
                <Label htmlFor="primary_contact_person">Primary Contact Person *</Label>
                <Input
                  id="primary_contact_person"
                  name="primary_contact_person"
                  value={formData.primary_contact_person}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_id">Email ID *</Label>
                <Input
                  id="email_id"
                  name="email_id"
                  type="email"
                  value={formData.email_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_country_code">Primary Country Code *</Label>
                <Input
                  id="primary_country_code"
                  name="primary_country_code"
                  value={formData.primary_country_code}
                  onChange={handleInputChange}
                  required
                  placeholder="+91"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_mobile_number">Primary Mobile Number *</Label>
                <Input
                  id="primary_mobile_number"
                  name="primary_mobile_number"
                  value={formData.primary_mobile_number}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_contact_person">Secondary Contact Person</Label>
                <Input
                  id="secondary_contact_person"
                  name="secondary_contact_person"
                  value={formData.secondary_contact_person || ""}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_country_code">Secondary Country Code</Label>
                <Input
                  id="secondary_country_code"
                  name="secondary_country_code"
                  value={formData.secondary_country_code || ""}
                  onChange={handleInputChange}
                  placeholder="+91"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_mobile_number">Secondary Mobile Number</Label>
                <Input
                  id="secondary_mobile_number"
                  name="secondary_mobile_number"
                  value={formData.secondary_mobile_number || ""}
                  onChange={handleInputChange}
                  maxLength={10}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_country_code">WhatsApp Country Code *</Label>
                <Input
                  id="whatsapp_country_code"
                  name="whatsapp_country_code"
                  value={formData.whatsapp_country_code}
                  onChange={handleInputChange}
                  required
                  placeholder="+91"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_communication_number">WhatsApp Number *</Label>
                <Input
                  id="whatsapp_communication_number"
                  name="whatsapp_communication_number"
                  value={formData.whatsapp_communication_number}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                />
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logo">Distributor Logo (Max 2MB, PNG/JPG)</Label>
                <Input
                  id="logo"
                  name="logo"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Logo Preview:</p>
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="mt-1 h-20 w-20 object-contain border rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedDistributor?.distributor_name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Distributor QR Code</DialogTitle>
          </DialogHeader>
          {selectedDistributor && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-md">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    JSON.stringify({
                      id: selectedDistributor.distributor_id,
                      name: selectedDistributor.distributor_name,
                      contact: `${selectedDistributor.primary_country_code}${selectedDistributor.primary_mobile_number}`,
                      email: selectedDistributor.email_id
                    })
                  )}`}
                  alt="QR Code"
                  className="w-40 h-40"
                />
              </div>
              <p className="mt-2 text-center text-sm text-gray-500">
                Scan this QR code to get distributor details
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DistributorManagement;
