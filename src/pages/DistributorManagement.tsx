
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import QRCode from 'qrcode.react';
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';

interface Distributor {
  distributor_id: number;
  distributor_name: string;
  city: string;
  address: string;
  primary_contact_person: string;
  primary_country_code: string;
  primary_mobile_number: string;
  primary_number?: string;
  secondary_contact_person: string | null;
  secondary_country_code: string | null;
  secondary_mobile_number: string | null;
  secondary_number?: string;
  email_id: string;
  gst_number: string;
  distributor_category: string;
  whatsapp_country_code: string;
  whatsapp_communication_number: string;
  whatsapp_number?: string;
  distributor_logo: string | null;
  created_by: number;
}

const DistributorManagement = () => {
  const { user, token } = useAuth();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [filteredDistributors, setFilteredDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState<boolean>(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    distributor_name: '',
    city: '',
    address: '',
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
    distributor_logo: null as File | null,
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Fetch distributors with pagination and filters
  const fetchDistributors = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/distributors?page=${currentPage}&per_page=${itemsPerPage}`;
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      if (cityFilter) {
        url += `&city=${encodeURIComponent(cityFilter)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setDistributors(data.distributors);
      setTotalPages(data.total_pages);
      setCurrentPage(data.current_page);
      setTotalCount(data.total_count);
      
      // Extract unique categories and cities for filters
      if (data.categories) {
        setCategories(data.categories);
      }
      
      if (data.cities) {
        setCities(data.cities);
      }
    } catch (err) {
      console.error('Error fetching distributors:', err);
      setError('Failed to fetch distributors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
  }, [currentPage, search, categoryFilter, cityFilter]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filters
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleCityChange = (value: string) => {
    setCityFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Open modal for adding new distributor
  const handleAddDistributor = () => {
    setFormData({
      distributor_name: '',
      city: '',
      address: '',
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
      distributor_logo: null,
    });
    setPreviewLogo(null);
    setFormErrors({});
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Open modal for editing distributor
  const handleEditDistributor = async (distributorId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/distributor/${distributorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch distributor details');
      }
      
      const distributor = await response.json();
      
      setFormData({
        distributor_name: distributor.distributor_name,
        city: distributor.city,
        address: distributor.address,
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
        distributor_logo: null,
      });
      
      setPreviewLogo(distributor.distributor_logo ? `${API_URL}${distributor.distributor_logo}` : null);
      setSelectedDistributor(distributor);
      setIsEditing(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching distributor details:', error);
      toast.error('Failed to load distributor details');
    }
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

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        distributor_logo: 'File size exceeds 2MB limit'
      }));
      return;
    }
    
    // Validate file type
    const fileType = file.type.toLowerCase();
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(fileType)) {
      setFormErrors(prev => ({
        ...prev,
        distributor_logo: 'Only JPG, JPEG, and PNG files are allowed'
      }));
      return;
    }
    
    // Clear any previous errors
    if (formErrors.distributor_logo) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.distributor_logo;
        return newErrors;
      });
    }
    
    // Set file and preview
    setFormData(prev => ({
      ...prev,
      distributor_logo: file
    }));
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.distributor_name.trim()) {
      errors.distributor_name = 'Distributor name is required';
    }
    
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.primary_contact_person.trim()) {
      errors.primary_contact_person = 'Primary contact person is required';
    }
    
    if (!formData.primary_mobile_number.trim()) {
      errors.primary_mobile_number = 'Primary mobile number is required';
    } else if (!/^\d{10}$/.test(formData.primary_mobile_number)) {
      errors.primary_mobile_number = 'Mobile number must be 10 digits';
    }
    
    if (formData.secondary_mobile_number && !/^\d{10}$/.test(formData.secondary_mobile_number)) {
      errors.secondary_mobile_number = 'Mobile number must be 10 digits';
    }
    
    if (!formData.email_id.trim()) {
      errors.email_id = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email_id)) {
      errors.email_id = 'Invalid email format';
    }
    
    if (!formData.gst_number.trim()) {
      errors.gst_number = 'GST number is required';
    }
    
    if (!formData.distributor_category) {
      errors.distributor_category = 'Distributor category is required';
    }
    
    if (!formData.whatsapp_communication_number.trim()) {
      errors.whatsapp_communication_number = 'WhatsApp number is required';
    } else if (!/^\d{10}$/.test(formData.whatsapp_communication_number)) {
      errors.whatsapp_communication_number = 'WhatsApp number must be 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          if (key === 'distributor_logo' && value instanceof File) {
            formDataObj.append(key, value);
          } else if (typeof value === 'string') {
            formDataObj.append(key, value);
          }
        }
      });
      
      let url = `${API_URL}/api/distributors`;
      let method = 'POST';
      
      if (isEditing && selectedDistributor) {
        url = `${API_URL}/api/distributor/${selectedDistributor.distributor_id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save distributor');
      }
      
      toast.success(isEditing ? 'Distributor updated successfully' : 'Distributor added successfully');
      setIsModalOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error('Error saving distributor:', error);
      toast.error((error as Error).message || 'Failed to save distributor');
    }
  };

  // Delete distributor handler
  const handleDeleteDistributor = async () => {
    if (!selectedDistributor) return;
    
    try {
      const response = await fetch(`${API_URL}/api/distributor/${selectedDistributor.distributor_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete distributor');
      }
      
      toast.success('Distributor deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast.error('Failed to delete distributor');
    }
  };

  // Check permissions
  const canCreate = () => {
    return user?.role === "Admin" || user?.role === "Manager" || user?.role === "Employee";
  };

  const canEdit = (distributorCreatedBy: number) => {
    return user?.role === "Admin" || (user?.role === "Manager" && user?.id === distributorCreatedBy);
  };

  const canDelete = () => {
    return user?.role === "Admin";
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const paginationItems = [];
    const maxVisiblePages = 5;
    
    // Previous button
    paginationItems.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );
    
    // Calculate range of page numbers to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page if not in range
    if (startPage > 1) {
      paginationItems.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        paginationItems.push(
          <PaginationItem key="ellipsis1">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Last page if not in range
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationItems.push(
          <PaginationItem key="ellipsis2">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
      
      paginationItems.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    paginationItems.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        />
      </PaginationItem>
    );
    
    return (
      <Pagination>
        <PaginationContent>
          {paginationItems}
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <CardTitle className="text-2xl">Distributor Management</CardTitle>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <Input 
                placeholder="Search by name, city, or GST..." 
                value={search}
                onChange={handleSearchChange}
                className="w-full md:w-64"
              />
              
              <div className="flex space-x-4">
                <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={cityFilter} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {canCreate() && (
                  <Button onClick={handleAddDistributor}>Add Distributor</Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading distributors...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : distributors.length === 0 ? (
            <div className="text-center py-4">No distributors found.</div>
          ) : (
            <>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Distributor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Primary Number</TableHead>
                      <TableHead>Secondary Contact</TableHead>
                      <TableHead>Secondary Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>GST Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Logo</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributors.map((distributor, index) => (
                      <TableRow key={distributor.distributor_id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell>{distributor.distributor_name}</TableCell>
                        <TableCell>{distributor.city}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={distributor.address}>
                          {distributor.address}
                        </TableCell>
                        <TableCell>{distributor.primary_contact_person}</TableCell>
                        <TableCell>
                          {distributor.primary_number || 
                           `${distributor.primary_country_code}${distributor.primary_mobile_number}`}
                        </TableCell>
                        <TableCell>{distributor.secondary_contact_person || '-'}</TableCell>
                        <TableCell>
                          {distributor.secondary_number || 
                           (distributor.secondary_mobile_number ? 
                            `${distributor.secondary_country_code}${distributor.secondary_mobile_number}` : 
                            '-')}
                        </TableCell>
                        <TableCell>{distributor.email_id}</TableCell>
                        <TableCell>{distributor.gst_number}</TableCell>
                        <TableCell>{distributor.distributor_category}</TableCell>
                        <TableCell>
                          {distributor.whatsapp_number || 
                           `${distributor.whatsapp_country_code}${distributor.whatsapp_communication_number}`}
                        </TableCell>
                        <TableCell>
                          {distributor.distributor_logo ? (
                            <img 
                              src={`${API_URL}${distributor.distributor_logo}`} 
                              alt={`${distributor.distributor_name} logo`}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {canEdit(distributor.created_by) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditDistributor(distributor.distributor_id)}
                              >
                                Edit
                              </Button>
                            )}
                            
                            {canDelete() && (
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteClick(distributor)}
                              >
                                Delete
                              </Button>
                            )}
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleQrCodeClick(distributor)}
                            >
                              QR Code
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {distributors.length} of {totalCount} distributors
                </div>
                {renderPagination()}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Distributor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Update the distributor information below.' 
                : 'Fill in the details to add a new distributor.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributor_name">Distributor Name *</Label>
                <Input 
                  id="distributor_name" 
                  name="distributor_name" 
                  value={formData.distributor_name} 
                  onChange={handleInputChange}
                  className={formErrors.distributor_name ? 'border-red-500' : ''}
                />
                {formErrors.distributor_name && (
                  <p className="text-red-500 text-sm">{formErrors.distributor_name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange}
                  className={formErrors.city ? 'border-red-500' : ''}
                />
                {formErrors.city && (
                  <p className="text-red-500 text-sm">{formErrors.city}</p>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleInputChange}
                  className={formErrors.address ? 'border-red-500' : ''}
                />
                {formErrors.address && (
                  <p className="text-red-500 text-sm">{formErrors.address}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_contact_person">Primary Contact Person *</Label>
                <Input 
                  id="primary_contact_person" 
                  name="primary_contact_person" 
                  value={formData.primary_contact_person} 
                  onChange={handleInputChange}
                  className={formErrors.primary_contact_person ? 'border-red-500' : ''}
                />
                {formErrors.primary_contact_person && (
                  <p className="text-red-500 text-sm">{formErrors.primary_contact_person}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_mobile_number">Primary Mobile Number *</Label>
                <div className="flex">
                  <Select 
                    name="primary_country_code" 
                    value={formData.primary_country_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primary_country_code: value }))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="+91" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    id="primary_mobile_number" 
                    name="primary_mobile_number" 
                    value={formData.primary_mobile_number} 
                    onChange={handleInputChange}
                    className={`flex-1 ml-2 ${formErrors.primary_mobile_number ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.primary_mobile_number && (
                  <p className="text-red-500 text-sm">{formErrors.primary_mobile_number}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_contact_person">Secondary Contact Person</Label>
                <Input 
                  id="secondary_contact_person" 
                  name="secondary_contact_person" 
                  value={formData.secondary_contact_person} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_mobile_number">Secondary Mobile Number</Label>
                <div className="flex">
                  <Select 
                    name="secondary_country_code" 
                    value={formData.secondary_country_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, secondary_country_code: value }))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="+91" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    id="secondary_mobile_number" 
                    name="secondary_mobile_number" 
                    value={formData.secondary_mobile_number} 
                    onChange={handleInputChange}
                    className={`flex-1 ml-2 ${formErrors.secondary_mobile_number ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.secondary_mobile_number && (
                  <p className="text-red-500 text-sm">{formErrors.secondary_mobile_number}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_id">Email ID *</Label>
                <Input 
                  id="email_id" 
                  name="email_id" 
                  type="email"
                  value={formData.email_id} 
                  onChange={handleInputChange}
                  className={formErrors.email_id ? 'border-red-500' : ''}
                />
                {formErrors.email_id && (
                  <p className="text-red-500 text-sm">{formErrors.email_id}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number *</Label>
                <Input 
                  id="gst_number" 
                  name="gst_number" 
                  value={formData.gst_number} 
                  onChange={handleInputChange}
                  className={formErrors.gst_number ? 'border-red-500' : ''}
                />
                {formErrors.gst_number && (
                  <p className="text-red-500 text-sm">{formErrors.gst_number}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distributor_category">Distributor Category *</Label>
                <Select 
                  name="distributor_category" 
                  value={formData.distributor_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, distributor_category: value }))}
                >
                  <SelectTrigger className={formErrors.distributor_category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.distributor_category && (
                  <p className="text-red-500 text-sm">{formErrors.distributor_category}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_communication_number">WhatsApp Number *</Label>
                <div className="flex">
                  <Select 
                    name="whatsapp_country_code" 
                    value={formData.whatsapp_country_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_country_code: value }))}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="+91" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">+91</SelectItem>
                      <SelectItem value="+1">+1</SelectItem>
                      <SelectItem value="+44">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    id="whatsapp_communication_number" 
                    name="whatsapp_communication_number" 
                    value={formData.whatsapp_communication_number} 
                    onChange={handleInputChange}
                    className={`flex-1 ml-2 ${formErrors.whatsapp_communication_number ? 'border-red-500' : ''}`}
                  />
                </div>
                {formErrors.whatsapp_communication_number && (
                  <p className="text-red-500 text-sm">{formErrors.whatsapp_communication_number}</p>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="distributor_logo">Distributor Logo</Label>
                <Input 
                  id="distributor_logo" 
                  name="distributor_logo" 
                  type="file" 
                  accept=".jpg,.jpeg,.png"
                  onChange={handleLogoChange}
                  className={formErrors.distributor_logo ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500">
                  Maximum file size: 2MB. Allowed formats: JPG, JPEG, PNG.
                </p>
                {formErrors.distributor_logo && (
                  <p className="text-red-500 text-sm">{formErrors.distributor_logo}</p>
                )}
                
                {previewLogo && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Logo Preview:</p>
                    <img 
                      src={previewLogo} 
                      alt="Logo preview" 
                      className="w-24 h-24 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Distributor' : 'Add Distributor'}
              </Button>
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
              This will permanently delete the distributor 
              <span className="font-medium"> {selectedDistributor?.distributor_name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDistributor} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Distributor QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to access distributor information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDistributor && (
            <div className="flex flex-col items-center justify-center py-4">
              <QRCode 
                value={JSON.stringify({
                  id: selectedDistributor.distributor_id,
                  name: selectedDistributor.distributor_name,
                  city: selectedDistributor.city,
                  email: selectedDistributor.email_id,
                  gst: selectedDistributor.gst_number
                })}
                size={200}
                level="H"
              />
              <p className="mt-4 text-center font-medium">
                {selectedDistributor.distributor_name}
              </p>
              <p className="text-sm text-gray-500">
                {selectedDistributor.city} • {selectedDistributor.gst_number}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsQrDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributorManagement;
