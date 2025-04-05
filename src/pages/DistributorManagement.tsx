
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';
import { QRCodeSVG } from 'qrcode.react'; // Updated import to use named export

interface Distributor {
  distributor_id: number;
  distributor_name: string;
  city: string;
  address: string;
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

const DistributorManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // States for distributors and pagination
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // States for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [uniqueCities, setUniqueCities] = useState<string[]>([]);

  // States for add/edit form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDistributor, setCurrentDistributor] = useState<Partial<Distributor>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // States for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [distributorToDelete, setDistributorToDelete] = useState<number | null>(null);

  // State for QR code modal
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [qrCodeData, setQRCodeData] = useState('');
  const [qrCodeDistributor, setQRCodeDistributor] = useState<Partial<Distributor>>({});

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchDistributors();
  }, [token, navigate, currentPage, searchQuery, categoryFilter, cityFilter]);

  const fetchDistributors = async () => {
    try {
      let url = `${API_URL}/api/distributors?page=${currentPage}&per_page=${itemsPerPage}`;
      
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
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
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      
      // Extract unique categories and cities for filters
      if (!categoryFilter && !cityFilter) {
        const categories = [...new Set(data.distributors.map((d: Distributor) => d.distributor_category))];
        const cities = [...new Set(data.distributors.map((d: Distributor) => d.city))];
        setUniqueCategories(categories);
        setUniqueCities(cities);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast({
        title: "Error",
        description: `Failed to load distributors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleAddDistributor = () => {
    setIsEditMode(false);
    setCurrentDistributor({});
    setLogoPreview(null);
    setLogoFile(null);
    setIsFormOpen(true);
  };

  const handleEditDistributor = (distributor: Distributor) => {
    setIsEditMode(true);
    setCurrentDistributor({...distributor});
    setLogoPreview(distributor.distributor_logo ? `${API_URL}${distributor.distributor_logo}` : null);
    setLogoFile(null);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (distributorId: number) => {
    setDistributorToDelete(distributorId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!distributorToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/distributors/${distributorToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: "Distributor deleted successfully",
      });
      
      fetchDistributors();
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast({
        title: "Error",
        description: `Failed to delete distributor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDistributorToDelete(null);
    }
  };

  const handleShowQRCode = (distributor: Distributor) => {
    // Create QR code data with distributor information
    const qrData = JSON.stringify({
      id: distributor.distributor_id,
      name: distributor.distributor_name,
      email: distributor.email_id,
      gst: distributor.gst_number,
    });
    
    setQRCodeData(qrData);
    setQRCodeDistributor(distributor);
    setIsQRCodeOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDistributor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentDistributor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload JPEG, JPG, or PNG images only",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentDistributor.distributor_name || 
        !currentDistributor.city || 
        !currentDistributor.address || 
        !currentDistributor.primary_contact_person || 
        !currentDistributor.primary_mobile_number || 
        !currentDistributor.email_id || 
        !currentDistributor.gst_number || 
        !currentDistributor.distributor_category || 
        !currentDistributor.whatsapp_communication_number) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formData = new FormData();
      
      // Append all distributor data to formData
      Object.entries(currentDistributor).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      // Add logo if selected
      if (logoFile) {
        formData.append('distributor_logo', logoFile);
      }
      
      // Determine if this is an update or a new distributor
      const url = isEditMode 
        ? `${API_URL}/api/distributors/${currentDistributor.distributor_id}` 
        : `${API_URL}/api/distributors`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      toast({
        title: "Success",
        description: isEditMode ? "Distributor updated successfully" : "Distributor added successfully",
      });
      
      setIsFormOpen(false);
      fetchDistributors();
    } catch (error) {
      console.error('Error saving distributor:', error);
      toast({
        title: "Error",
        description: `Failed to save distributor: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const canAddDistributor = (): boolean => {
    if (!user) return false;
    return user.role === "Admin" || user.role === "Manager" || user.role === "Employee";
  };

  const canEditDistributor = (createdBy: number): boolean => {
    if (!user) return false;
    return user.role === "Admin" || (user.role === "Manager" && user.id === createdBy);
  };

  const canDeleteDistributor = (): boolean => {
    if (!user) return false;
    return user.role === "Admin";
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-2xl">Distributor Management</CardTitle>
            <CardDescription>
              Manage your company's distributors
            </CardDescription>
          </div>
          {canAddDistributor() && (
            <Button onClick={handleAddDistributor} className="mt-2 sm:mt-0">
              Add Distributor
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name, city, or GST number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={cityFilter}
                onValueChange={(value) => setCityFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {uniqueCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading distributors...</div>
          ) : distributors.length === 0 ? (
            <div className="text-center py-8">No distributors found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Distributor Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Primary Contact</TableHead>
                      <TableHead>Primary Mobile</TableHead>
                      <TableHead>Email ID</TableHead>
                      <TableHead>GST Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Logo</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributors.map((distributor, index) => (
                      <TableRow key={distributor.distributor_id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="font-medium">{distributor.distributor_name}</TableCell>
                        <TableCell>{distributor.city}</TableCell>
                        <TableCell>{distributor.address}</TableCell>
                        <TableCell>{distributor.primary_contact_person}</TableCell>
                        <TableCell>{`${distributor.primary_country_code} ${distributor.primary_mobile_number}`}</TableCell>
                        <TableCell>{distributor.email_id}</TableCell>
                        <TableCell>{distributor.gst_number}</TableCell>
                        <TableCell>{distributor.distributor_category}</TableCell>
                        <TableCell>
                          {distributor.distributor_logo ? (
                            <img 
                              src={`${API_URL}${distributor.distributor_logo}`} 
                              alt={`${distributor.distributor_name} logo`} 
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                              No logo
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleShowQRCode(distributor)}
                            >
                              QR
                            </Button>
                            {canEditDistributor(distributor.created_by) && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditDistributor(distributor)}
                              >
                                Edit
                              </Button>
                            )}
                            {canDeleteDistributor() && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeleteConfirmation(distributor.distributor_id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Distributor Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update the distributor information below.' 
                : 'Fill out the form below to add a new distributor.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributor_name">Distributor Name *</Label>
                <Input
                  id="distributor_name"
                  name="distributor_name"
                  value={currentDistributor.distributor_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={currentDistributor.city || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={currentDistributor.address || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_contact_person">Primary Contact Person *</Label>
                <Input
                  id="primary_contact_person"
                  name="primary_contact_person"
                  value={currentDistributor.primary_contact_person || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_mobile_number">Primary Mobile Number *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="primary_country_code"
                    name="primary_country_code"
                    value={currentDistributor.primary_country_code || '+91'}
                    onChange={handleInputChange}
                    className="w-20"
                    required
                  />
                  <Input
                    id="primary_mobile_number"
                    name="primary_mobile_number"
                    value={currentDistributor.primary_mobile_number || ''}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_contact_person">Secondary Contact Person</Label>
                <Input
                  id="secondary_contact_person"
                  name="secondary_contact_person"
                  value={currentDistributor.secondary_contact_person || ''}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_mobile_number">Secondary Mobile Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="secondary_country_code"
                    name="secondary_country_code"
                    value={currentDistributor.secondary_country_code || '+91'}
                    onChange={handleInputChange}
                    className="w-20"
                  />
                  <Input
                    id="secondary_mobile_number"
                    name="secondary_mobile_number"
                    value={currentDistributor.secondary_mobile_number || ''}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email_id">Email ID *</Label>
                <Input
                  id="email_id"
                  name="email_id"
                  type="email"
                  value={currentDistributor.email_id || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number *</Label>
                <Input
                  id="gst_number"
                  name="gst_number"
                  value={currentDistributor.gst_number || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="distributor_category">Distributor Category *</Label>
                <Select
                  value={currentDistributor.distributor_category || ''}
                  onValueChange={(value) => handleSelectChange('distributor_category', value)}
                  required
                >
                  <SelectTrigger>
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
                <Label htmlFor="whatsapp_number">WhatsApp Communication Number *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="whatsapp_country_code"
                    name="whatsapp_country_code"
                    value={currentDistributor.whatsapp_country_code || '+91'}
                    onChange={handleInputChange}
                    className="w-20"
                    required
                  />
                  <Input
                    id="whatsapp_communication_number"
                    name="whatsapp_communication_number"
                    value={currentDistributor.whatsapp_communication_number || ''}
                    onChange={handleInputChange}
                    pattern="[0-9]{10}"
                    title="Please enter a 10-digit mobile number"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="distributor_logo">Distributor Logo</Label>
                <Input
                  id="distributor_logo"
                  name="distributor_logo"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                />
                <div className="text-sm text-gray-500 mt-1">
                  Maximum file size: 2MB. Formats: PNG, JPG, JPEG
                </div>
                
                {logoPreview && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-2">Logo Preview:</p>
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 object-cover border rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Distributor' : 'Add Distributor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this distributor? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRCodeOpen} onOpenChange={setIsQRCodeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Distributor QR Code</DialogTitle>
            <DialogDescription>
              {qrCodeDistributor.distributor_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <QRCodeSVG 
                value={qrCodeData} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">
              Scan this QR code to access distributor information
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsQRCodeOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistributorManagement;
