
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription,
  DialogClose 
} from '../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '../components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';

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
  created_by: number | null;
  created_at: string;
  updated_at: string | null;
}

const DistributorManagement: React.FC = () => {
  const { user } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    distributor_name: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    website: '',
    primary_contact_person: '',
    primary_country_code: '+91',
    primary_mobile_number: '',
    secondary_contact_person: '',
    secondary_country_code: '+91',
    secondary_mobile_number: '',
    email_id: '',
    gst_number: '',
    distributor_category: '',
    whatsapp_country_code: '+91',
    whatsapp_communication_number: '',
    distributor_logo: null as File | null
  });
  
  // Preview logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Filter options
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  
  // Role-based access control
  const canCreate = user && ['admin', 'manager', 'employee'].includes(user.role);
  const canEdit = user && ['admin', 'manager'].includes(user.role);
  const canDelete = user && user.role === 'admin';
  
  // Fetch distributors from API
  const fetchDistributors = async () => {
    try {
      const response = await fetch('/api/distributors');
      const data = await response.json();
      
      if (data.success) {
        setDistributors(data.distributors);
        setFilteredDistributors(data.distributors);
      } else {
        toast.error(data.error || 'Failed to fetch distributors');
      }
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast.error('Failed to fetch distributors');
    }
  };
  
  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [categoriesRes, citiesRes, statesRes] = await Promise.all([
        fetch('/api/distributors/categories').then(res => res.json()),
        fetch('/api/distributors/cities').then(res => res.json()),
        fetch('/api/distributors/states').then(res => res.json())
      ]);
      
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories);
      }
      
      if (citiesRes.success) {
        setCities(citiesRes.cities);
      }
      
      if (statesRes.success) {
        setStates(statesRes.states);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };
  
  useEffect(() => {
    fetchDistributors();
    fetchFilterOptions();
  }, []);
  
  // Filter distributors
  useEffect(() => {
    let filtered = [...distributors];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        dist => 
          dist.distributor_name.toLowerCase().includes(query) ||
          dist.city.toLowerCase().includes(query) ||
          dist.gst_number.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(dist => dist.distributor_category === selectedCategory);
    }
    
    // City filter
    if (selectedCity) {
      filtered = filtered.filter(dist => dist.city === selectedCity);
    }
    
    // State filter
    if (selectedState) {
      filtered = filtered.filter(dist => dist.state === selectedState);
    }
    
    setFilteredDistributors(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedCategory, selectedCity, selectedState, distributors]);
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDistributors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDistributors.length / itemsPerPage);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit');
        return;
      }
      
      // Check file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Only PNG, JPG, and JPEG images are allowed');
        return;
      }
      
      setFormData(prev => ({ ...prev, distributor_logo: file }));
      
      // Set preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Open add modal
  const openAddModal = () => {
    // Reset form
    setFormData({
      distributor_name: '',
      city: '',
      state: '',
      pincode: '',
      address: '',
      website: '',
      primary_contact_person: '',
      primary_country_code: '+91',
      primary_mobile_number: '',
      secondary_contact_person: '',
      secondary_country_code: '+91',
      secondary_mobile_number: '',
      email_id: '',
      gst_number: '',
      distributor_category: '',
      whatsapp_country_code: '+91',
      whatsapp_communication_number: '',
      distributor_logo: null
    });
    setLogoPreview(null);
    setSelectedDistributor(null);
    setIsAddModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setFormData({
      distributor_name: distributor.distributor_name,
      city: distributor.city,
      state: distributor.state,
      pincode: distributor.pincode,
      address: distributor.address,
      website: distributor.website || '',
      primary_contact_person: distributor.primary_contact_person,
      primary_country_code: distributor.primary_country_code,
      primary_mobile_number: distributor.primary_mobile_number,
      secondary_contact_person: distributor.secondary_contact_person || '',
      secondary_country_code: distributor.secondary_country_code || '+91',
      secondary_mobile_number: distributor.secondary_mobile_number || '',
      email_id: distributor.email_id,
      gst_number: distributor.gst_number,
      distributor_category: distributor.distributor_category,
      whatsapp_country_code: distributor.whatsapp_country_code,
      whatsapp_communication_number: distributor.whatsapp_communication_number,
      distributor_logo: null
    });
    setLogoPreview(distributor.distributor_logo ? `${distributor.distributor_logo}` : null);
    setIsAddModalOpen(true);
  };
  
  // Open delete confirmation
  const openDeleteConfirmation = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setIsDeleteAlertOpen(true);
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'distributor_name', 'city', 'state', 'pincode', 'address',
      'primary_contact_person', 'primary_country_code', 'primary_mobile_number',
      'email_id', 'gst_number', 'distributor_category',
      'whatsapp_country_code', 'whatsapp_communication_number'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    // Create FormData
    const formPayload = new FormData();
    
    // Add all form fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'distributor_logo') {
        if (value) {
          formPayload.append(key, value);
        }
      } else if (value !== null && value !== undefined) {
        formPayload.append(key, value);
      }
    });
    
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
          body: formPayload
        });
      } else {
        // Create new distributor
        response = await fetch('/api/distributors', {
          method: 'POST',
          body: formPayload
        });
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setIsAddModalOpen(false);
        fetchDistributors(); // Refresh list
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    }
  };
  
  // Delete distributor
  const handleDelete = async () => {
    if (!selectedDistributor) return;
    
    try {
      const response = await fetch(`/api/distributors/${selectedDistributor.distributor_id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setIsDeleteAlertOpen(false);
        fetchDistributors(); // Refresh list
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast.error('Failed to delete distributor');
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Distributor Management</CardTitle>
          <CardDescription>
            Manage all distributors in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/4">
              <Input 
                placeholder="Search by name, city, GST..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-1/4">
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/4">
              <Select value={selectedCity} onValueChange={(value) => setSelectedCity(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/4">
              <Select value={selectedState} onValueChange={(value) => setSelectedState(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto">
              {canCreate && (
                <Button onClick={openAddModal}>Add Distributor</Button>
              )}
            </div>
          </div>
          
          {/* Distributors Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Distributor Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((distributor, index) => (
                    <TableRow key={distributor.distributor_id}>
                      <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                      <TableCell>{distributor.distributor_name}</TableCell>
                      <TableCell>{distributor.city}</TableCell>
                      <TableCell>{distributor.state}</TableCell>
                      <TableCell>{distributor.primary_contact_person}</TableCell>
                      <TableCell>{distributor.primary_country_code} {distributor.primary_mobile_number}</TableCell>
                      <TableCell>{distributor.email_id}</TableCell>
                      <TableCell>{distributor.gst_number}</TableCell>
                      <TableCell>{distributor.distributor_category}</TableCell>
                      <TableCell>
                        {distributor.distributor_logo ? (
                          <img 
                            src={distributor.distributor_logo} 
                            alt="Logo" 
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <span>No Logo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {canEdit && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditModal(distributor)}
                            >
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openDeleteConfirmation(distributor)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-4">
                      No distributors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </PaginationLink>
                </PaginationItem>
                
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      onClick={() => setCurrentPage(index + 1)}
                      isActive={currentPage === index + 1}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationLink 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDistributor ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              Fill in the distributor details below
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distributor Name */}
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
              
              {/* City */}
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
              
              {/* State */}
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
              
              {/* Pincode */}
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  required
                  type="text"
                  maxLength={10}
                />
              </div>
              
              {/* Address */}
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
              
              {/* Website */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>
              
              {/* Primary Contact Person */}
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
              
              {/* Primary Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="primary_mobile_number">Primary Mobile Number *</Label>
                <div className="flex">
                  <Input
                    id="primary_country_code"
                    name="primary_country_code"
                    value={formData.primary_country_code}
                    onChange={handleInputChange}
                    className="w-20 mr-2"
                    required
                  />
                  <Input
                    id="primary_mobile_number"
                    name="primary_mobile_number"
                    value={formData.primary_mobile_number}
                    onChange={handleInputChange}
                    required
                    maxLength={15}
                  />
                </div>
              </div>
              
              {/* Secondary Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="secondary_contact_person">Secondary Contact Person (Optional)</Label>
                <Input
                  id="secondary_contact_person"
                  name="secondary_contact_person"
                  value={formData.secondary_contact_person}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Secondary Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="secondary_mobile_number">Secondary Mobile Number (Optional)</Label>
                <div className="flex">
                  <Input
                    id="secondary_country_code"
                    name="secondary_country_code"
                    value={formData.secondary_country_code}
                    onChange={handleInputChange}
                    className="w-20 mr-2"
                  />
                  <Input
                    id="secondary_mobile_number"
                    name="secondary_mobile_number"
                    value={formData.secondary_mobile_number}
                    onChange={handleInputChange}
                    maxLength={15}
                  />
                </div>
              </div>
              
              {/* Email */}
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
              
              {/* GST Number */}
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number *</Label>
                <Input
                  id="gst_number"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => {
                    // Convert to uppercase for GST
                    setFormData(prev => ({
                      ...prev,
                      gst_number: e.target.value.toUpperCase()
                    }));
                  }}
                  required
                  maxLength={15}
                />
              </div>
              
              {/* Distributor Category */}
              <div className="space-y-2">
                <Label htmlFor="distributor_category">Distributor Category *</Label>
                <Select 
                  value={formData.distributor_category}
                  onValueChange={(value) => handleSelectChange('distributor_category', value)}
                  required
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
              
              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp_communication_number">WhatsApp Number *</Label>
                <div className="flex">
                  <Input
                    id="whatsapp_country_code"
                    name="whatsapp_country_code"
                    value={formData.whatsapp_country_code}
                    onChange={handleInputChange}
                    className="w-20 mr-2"
                    required
                  />
                  <Input
                    id="whatsapp_communication_number"
                    name="whatsapp_communication_number"
                    value={formData.whatsapp_communication_number}
                    onChange={handleInputChange}
                    required
                    maxLength={15}
                  />
                </div>
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="distributor_logo">Distributor Logo (Max 2MB, PNG/JPG)</Label>
                <Input
                  id="distributor_logo"
                  name="distributor_logo"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                
                {/* Logo Preview */}
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Logo Preview:</p>
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="w-32 h-32 object-contain border border-gray-200 rounded p-2"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit">{selectedDistributor ? 'Update' : 'Add'} Distributor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedDistributor?.distributor_name}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DistributorManagement;
