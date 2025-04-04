
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, QrCode, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

// Define type for distributor data
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
  created_at: string;
  updated_at: string;
}

interface DistributorFormData {
  distributor_name: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  website: string;
  primary_contact_person: string;
  primary_country_code: string;
  primary_mobile_number: string;
  secondary_contact_person: string;
  secondary_country_code: string;
  secondary_mobile_number: string;
  email_id: string;
  gst_number: string;
  distributor_category: string;
  whatsapp_country_code: string;
  whatsapp_communication_number: string;
  whatsapp_is_same_as_primary: boolean;
}

const categoryOptions = [
  { label: 'Wholesale', value: 'Wholesale' },
  { label: 'Retail', value: 'Retail' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Commercial', value: 'Commercial' }
];

const DistributorManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [distributorToDelete, setDistributorToDelete] = useState<Distributor | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Initialize the form state
  const [formData, setFormData] = useState<DistributorFormData>({
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
    whatsapp_is_same_as_primary: true
  });

  const API_BASE_URL = 'http://localhost:5000/api';
  const recordsPerPage = 10;
  
  useEffect(() => {
    fetchDistributors();
  }, []);

  useEffect(() => {
    filterDistributors();
  }, [searchTerm, selectedCategoryFilter, selectedCityFilter, selectedStateFilter, distributors]);
  
  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/distributors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch distributors');
      }
      
      const data = await response.json();
      setDistributors(data);
      
      // Extract unique cities and states for filter dropdowns
      const cities = [...new Set(data.map((d: Distributor) => d.city))];
      const states = [...new Set(data.map((d: Distributor) => d.state))];
      
      setCityOptions(cities);
      setStateOptions(states);
      
      calculateTotalPages(data.length);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast.error('Failed to load distributors');
    } finally {
      setLoading(false);
    }
  };
  
  const filterDistributors = () => {
    let filtered = [...distributors];
    
    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.distributor_name.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        d.gst_number.toLowerCase().includes(term)
      );
    }
    
    // Category filtering
    if (selectedCategoryFilter) {
      filtered = filtered.filter(d => d.distributor_category === selectedCategoryFilter);
    }
    
    // City filtering
    if (selectedCityFilter) {
      filtered = filtered.filter(d => d.city === selectedCityFilter);
    }
    
    // State filtering
    if (selectedStateFilter) {
      filtered = filtered.filter(d => d.state === selectedStateFilter);
    }
    
    setFilteredDistributors(filtered);
    calculateTotalPages(filtered.length);
    
    // Reset to first page when filters change
    setCurrentPage(1);
  };
  
  const calculateTotalPages = (totalRecords: number) => {
    setTotalPages(Math.ceil(totalRecords / recordsPerPage));
  };
  
  const getPaginatedDistributors = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return filteredDistributors.slice(startIndex, endIndex);
  };
  
  const resetForm = () => {
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
      whatsapp_is_same_as_primary: true
    });
    setPreviewLogo(null);
    setLogoFile(null);
    setIsEditMode(false);
    setSelectedDistributor(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle GST number formatting (uppercase)
    if (name === 'gst_number') {
      const formattedValue = value.toUpperCase();
      setFormData({ ...formData, [name]: formattedValue });
      return;
    }
    
    // Handle mobile number validation (digits only)
    if (name === 'primary_mobile_number' || name === 'secondary_mobile_number' || name === 'whatsapp_communication_number') {
      const formattedValue = value.replace(/\D/g, '').substring(0, 10);
      
      setFormData({ ...formData, [name]: formattedValue });
      
      // If WhatsApp is same as primary, update WhatsApp number too
      if (name === 'primary_mobile_number' && formData.whatsapp_is_same_as_primary) {
        setFormData(prev => ({
          ...prev,
          [name]: formattedValue,
          whatsapp_communication_number: formattedValue
        }));
      }
      return;
    }
    
    // For everything else
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (name: keyof DistributorFormData, value: string) => {
    setFormData({ ...formData, [name]: value });
  };
  
  const handleWhatsAppSameAsPrimary = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      whatsapp_is_same_as_primary: checked,
      whatsapp_communication_number: checked ? prev.primary_mobile_number : prev.whatsapp_communication_number
    }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image/(jpeg|jpg|png)')) {
      toast.error('File type not allowed. Please upload a JPG or PNG image.');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }
    
    setLogoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const validateForm = () => {
    // Required fields
    if (
      !formData.distributor_name ||
      !formData.city ||
      !formData.state ||
      !formData.pincode ||
      !formData.address ||
      !formData.primary_contact_person ||
      !formData.primary_country_code ||
      !formData.primary_mobile_number ||
      !formData.email_id ||
      !formData.gst_number ||
      !formData.distributor_category ||
      !formData.whatsapp_country_code ||
      !formData.whatsapp_communication_number
    ) {
      toast.error('Please fill in all required fields');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_id)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    // Mobile number validation
    if (formData.primary_mobile_number.length !== 10) {
      toast.error('Primary mobile number must be 10 digits');
      return false;
    }
    
    if (formData.secondary_mobile_number && formData.secondary_mobile_number.length !== 10) {
      toast.error('Secondary mobile number must be 10 digits');
      return false;
    }
    
    if (formData.whatsapp_communication_number.length !== 10) {
      toast.error('WhatsApp number must be 10 digits');
      return false;
    }
    
    // GST number validation (basic format check)
    const gstRegex = /^[0-9A-Z]{15}$/;
    if (!gstRegex.test(formData.gst_number)) {
      toast.error('Please enter a valid 15-character GST number');
      return false;
    }
    
    // Website validation (if provided)
    if (formData.website) {
      const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!urlRegex.test(formData.website)) {
        toast.error('Please enter a valid website URL');
        return false;
      }
    }
    
    // Logo validation for new distributors
    if (!isEditMode && !logoFile) {
      toast.error('Please upload a distributor logo');
      return false;
    }
    
    return true;
  };
  
  const handleAddEditDistributor = async () => {
    if (!validateForm()) return;
    
    try {
      const token = localStorage.getItem('token');
      const formDataObj = new FormData();
      
      // Add all distributor details to formData
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'whatsapp_is_same_as_primary') {
          formDataObj.append(key, value.toString());
        }
      });
      
      // Add logo if exists
      if (logoFile) {
        formDataObj.append('distributor_logo', logoFile);
      }
      
      let url = `${API_BASE_URL}/distributors`;
      let method = 'POST';
      
      if (isEditMode && selectedDistributor) {
        url = `${API_BASE_URL}/distributors/${selectedDistributor.distributor_id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        throw new Error(isEditMode ? 'Failed to update distributor' : 'Failed to add distributor');
      }
      
      // Refresh the distributor list
      await fetchDistributors();
      
      toast.success(isEditMode ? 'Distributor updated successfully' : 'Distributor added successfully');
      
      // Reset form and close modal
      resetForm();
      setIsAddDistributorModalOpen(false);
    } catch (error) {
      console.error('Error saving distributor:', error);
      toast.error(isEditMode ? 'Failed to update distributor' : 'Failed to add distributor');
    }
  };
  
  const handleEditDistributor = (distributor: Distributor) => {
    setIsEditMode(true);
    setSelectedDistributor(distributor);
    
    // Set form values
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
      whatsapp_is_same_as_primary: distributor.primary_mobile_number === distributor.whatsapp_communication_number
    });
    
    // Set preview logo if exists
    if (distributor.distributor_logo) {
      setPreviewLogo(`${API_BASE_URL}${distributor.distributor_logo}`);
    } else {
      setPreviewLogo(null);
    }
    
    setIsAddDistributorModalOpen(true);
  };
  
  const openDeleteConfirmation = (distributor: Distributor) => {
    setDistributorToDelete(distributor);
    setConfirmDeleteDialogOpen(true);
  };
  
  const handleDeleteDistributor = async () => {
    if (!distributorToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/distributors/${distributorToDelete.distributor_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete distributor');
      }
      
      // Refresh the distributor list
      await fetchDistributors();
      
      toast.success('Distributor deleted successfully');
      setConfirmDeleteDialogOpen(false);
      setDistributorToDelete(null);
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast.error('Failed to delete distributor');
    }
  };
  
  const canAddDistributor = () => {
    return user?.role === 'admin' || user?.role === 'manufacturer' || user?.role === 'manager' || user?.role === 'employee';
  };
  
  const canEditDistributor = (distributor: Distributor) => {
    return user?.role === 'admin' || user?.role === 'manufacturer';
  };
  
  const canDeleteDistributor = (distributor: Distributor) => {
    return user?.role === 'admin';
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-coolant-800">Distributor Management</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search distributors..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCityFilter} onValueChange={setSelectedCityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {cityOptions.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedStateFilter} onValueChange={setSelectedStateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  {stateOptions.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {canAddDistributor() && (
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddDistributorModalOpen(true);
                }}
                className="w-full sm:w-auto bg-coolant-500 hover:bg-coolant-600 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Distributor</span>
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Distributors</CardTitle>
            <CardDescription>
              View and manage all distributor records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">S.No</TableHead>
                      <TableHead>Distributor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Primary Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>GST Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Logo</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedDistributors().length > 0 ? (
                      getPaginatedDistributors().map((distributor, index) => (
                        <TableRow key={distributor.distributor_id}>
                          <TableCell>{(currentPage - 1) * recordsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{distributor.distributor_name}</TableCell>
                          <TableCell>{distributor.city}</TableCell>
                          <TableCell>{distributor.state}</TableCell>
                          <TableCell>{distributor.primary_contact_person}</TableCell>
                          <TableCell>{distributor.primary_country_code}{distributor.primary_mobile_number}</TableCell>
                          <TableCell>{distributor.email_id}</TableCell>
                          <TableCell>{distributor.gst_number}</TableCell>
                          <TableCell>{distributor.distributor_category}</TableCell>
                          <TableCell>
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
                              <img 
                                src={distributor.distributor_logo ? `${API_BASE_URL}${distributor.distributor_logo}` : '/placeholder.svg'} 
                                alt={`${distributor.distributor_name} logo`} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              {canEditDistributor(distributor) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditDistributor(distributor)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {canDeleteDistributor(distributor) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => openDeleteConfirmation(distributor)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-4 text-gray-500">
                          No distributors found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredDistributors.length ? (currentPage - 1) * recordsPerPage + 1 : 0} to {Math.min(currentPage * recordsPerPage, filteredDistributors.length)} of {filteredDistributors.length} distributors
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Add/Edit Distributor Modal */}
      <Dialog open={isAddDistributorModalOpen} onOpenChange={setIsAddDistributorModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? `Update the distributor information for ${selectedDistributor?.distributor_name}.`
                : 'Fill in the distributor information below. Required fields are marked with *.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distributor_name">Distributor Name *</Label>
              <Input 
                id="distributor_name" 
                name="distributor_name"
                placeholder="Enter distributor name"
                value={formData.distributor_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input 
                id="city" 
                name="city"
                placeholder="Enter city"
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
                placeholder="Enter state"
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
                placeholder="Enter pincode"
                value={formData.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, pincode: value });
                }}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input 
                id="address" 
                name="address"
                placeholder="Enter complete address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                name="website"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_contact_person">Primary Contact Person *</Label>
              <Input 
                id="primary_contact_person" 
                name="primary_contact_person"
                placeholder="Enter primary contact name"
                value={formData.primary_contact_person}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="primary_mobile_number">Primary Mobile Number *</Label>
              <div className="flex">
                <Input 
                  id="primary_country_code" 
                  name="primary_country_code"
                  className="w-20 rounded-r-none"
                  value={formData.primary_country_code}
                  onChange={handleInputChange}
                  required
                />
                <Input 
                  id="primary_mobile_number" 
                  name="primary_mobile_number"
                  className="rounded-l-none flex-1"
                  placeholder="10-digit mobile number"
                  value={formData.primary_mobile_number}
                  onChange={handleInputChange}
                  required
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_contact_person">Secondary Contact Person</Label>
              <Input 
                id="secondary_contact_person" 
                name="secondary_contact_person"
                placeholder="Enter secondary contact name (optional)"
                value={formData.secondary_contact_person}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_mobile_number">Secondary Mobile Number</Label>
              <div className="flex">
                <Input 
                  id="secondary_country_code" 
                  name="secondary_country_code"
                  className="w-20 rounded-r-none"
                  value={formData.secondary_country_code}
                  onChange={handleInputChange}
                />
                <Input 
                  id="secondary_mobile_number" 
                  name="secondary_mobile_number"
                  className="rounded-l-none flex-1"
                  placeholder="10-digit mobile number (optional)"
                  value={formData.secondary_mobile_number}
                  onChange={handleInputChange}
                  type="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email_id">Email ID *</Label>
              <Input 
                id="email_id" 
                name="email_id"
                type="email"
                placeholder="Enter email address"
                value={formData.email_id}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number *</Label>
              <Input 
                id="gst_number" 
                name="gst_number"
                placeholder="Enter GST number"
                value={formData.gst_number}
                onChange={handleInputChange}
                required
                maxLength={15}
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
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2 my-2">
              <Checkbox 
                id="whatsapp_is_same_as_primary" 
                checked={formData.whatsapp_is_same_as_primary}
                onCheckedChange={(checked) => handleWhatsAppSameAsPrimary(checked as boolean)}
              />
              <Label
                htmlFor="whatsapp_is_same_as_primary"
                className="text-sm font-medium leading-none"
              >
                Use Primary Mobile Number as WhatsApp Number
              </Label>
            </div>
            
            {!formData.whatsapp_is_same_as_primary && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="whatsapp_communication_number">WhatsApp Communication Number *</Label>
                <div className="flex">
                  <Input 
                    id="whatsapp_country_code" 
                    name="whatsapp_country_code"
                    className="w-20 rounded-r-none"
                    value={formData.whatsapp_country_code}
                    onChange={handleInputChange}
                    required
                  />
                  <Input 
                    id="whatsapp_communication_number" 
                    name="whatsapp_communication_number"
                    className="rounded-l-none flex-1"
                    placeholder="10-digit WhatsApp number"
                    value={formData.whatsapp_communication_number}
                    onChange={handleInputChange}
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    maxLength={10}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="logo">Distributor Logo {!isEditMode && '*'}</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="flex flex-col items-center justify-center space-y-4">
                  {previewLogo ? (
                    <div className="relative w-40 h-40 overflow-hidden">
                      <img 
                        src={previewLogo} 
                        alt="Logo preview" 
                        className="w-full h-full object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0 h-8 w-8"
                        onClick={() => {
                          setPreviewLogo(null);
                          setLogoFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-gray-400 text-center">No logo<br />uploaded</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center">
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer bg-coolant-500 text-white px-4 py-2 rounded-md font-medium hover:bg-coolant-600 transition-colors"
                    >
                      <span>{previewLogo ? 'Change logo' : 'Upload logo'}</span>
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <p className="text-xs mt-1 text-gray-500">JPG or PNG only (max. 2MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsAddDistributorModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddEditDistributor}
              className="bg-coolant-500 hover:bg-coolant-600 text-white"
            >
              {isEditMode ? 'Update Distributor' : 'Add Distributor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the distributor "{distributorToDelete?.distributor_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDistributor}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DistributorManagement;
