
import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// Define type for distributor data
interface Distributor {
  id: number;
  distributor_name: string;
  city: string;
  address: string;
  primary_contact_person: string;
  primary_number: string;
  secondary_contact_person: string;
  secondary_number: string;
  email: string;
  gst_number: string;
  distributor_category: string;
  whatsapp_number: string;
  distributor_logo: string;
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
  const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [newDistributor, setNewDistributor] = useState({
    distributor_name: '',
    city: '',
    address: '',
    primary_contact_person: '',
    primary_mobile_number: '',
    useAsWhatsapp: true,
    whatsapp_number: '',
    secondary_contact_person: '',
    secondary_mobile_number: '',
    email: '',
    gst_number: '',
    distributor_category: '',
    distributor_logo: null as File | null
  });
  const [previewLogo, setPreviewLogo] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Load distributors from API
  useEffect(() => {
    fetchDistributors();
  }, []);
  
  const fetchDistributors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/distributors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch distributors');
      }
      
      const data = await response.json();
      setDistributors(data);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      toast.error('Failed to load distributors');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter distributors based on role and search term
  const getFilteredDistributors = () => {
    let filtered = [...distributors];
    
    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.distributor_name.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        d.primary_contact_person.toLowerCase().includes(term) ||
        d.gst_number.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };
  
  const filteredDistributors = getFilteredDistributors();
  
  const handleAddDistributor = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add all distributor details to formData
      formData.append('distributor_name', newDistributor.distributor_name);
      formData.append('city', newDistributor.city);
      formData.append('address', newDistributor.address);
      formData.append('primary_contact_person', newDistributor.primary_contact_person);
      formData.append('primary_mobile_number', newDistributor.primary_mobile_number);
      
      if (newDistributor.useAsWhatsapp) {
        formData.append('whatsapp_number', newDistributor.primary_mobile_number);
      } else {
        formData.append('whatsapp_number', newDistributor.whatsapp_number);
      }
      
      formData.append('secondary_contact_person', newDistributor.secondary_contact_person || '');
      formData.append('secondary_mobile_number', newDistributor.secondary_mobile_number || '');
      formData.append('email', newDistributor.email);
      formData.append('gst_number', newDistributor.gst_number);
      formData.append('distributor_category', newDistributor.distributor_category);
      
      if (newDistributor.distributor_logo) {
        formData.append('distributor_logo', newDistributor.distributor_logo);
      }
      
      let url = 'http://localhost:5000/api/distributors';
      let method = 'POST';
      
      if (isEditMode && selectedDistributor) {
        url = `http://localhost:5000/api/distributors/${selectedDistributor.id}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
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
    setNewDistributor({
      distributor_name: distributor.distributor_name,
      city: distributor.city,
      address: distributor.address || '',
      primary_contact_person: distributor.primary_contact_person,
      primary_mobile_number: distributor.primary_number.replace('+91', ''),
      useAsWhatsapp: distributor.primary_number === distributor.whatsapp_number,
      whatsapp_number: distributor.whatsapp_number.replace('+91', ''),
      secondary_contact_person: distributor.secondary_contact_person !== '-' ? distributor.secondary_contact_person : '',
      secondary_mobile_number: distributor.secondary_number !== '-' ? distributor.secondary_number.replace('+91', '') : '',
      email: distributor.email,
      gst_number: distributor.gst_number,
      distributor_category: distributor.distributor_category,
      distributor_logo: null
    });
    
    setPreviewLogo(distributor.distributor_logo);
    
    setIsAddDistributorModalOpen(true);
  };
  
  const handleDeleteDistributor = async (distributorId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/distributors/${distributorId}`, {
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
    } catch (error) {
      console.error('Error deleting distributor:', error);
      toast.error('Failed to delete distributor');
    }
  };
  
  const resetForm = () => {
    setNewDistributor({
      distributor_name: '',
      city: '',
      address: '',
      primary_contact_person: '',
      primary_mobile_number: '',
      useAsWhatsapp: true,
      whatsapp_number: '',
      secondary_contact_person: '',
      secondary_mobile_number: '',
      email: '',
      gst_number: '',
      distributor_category: '',
      distributor_logo: null
    });
    setPreviewLogo('');
    setIsEditMode(false);
    setSelectedDistributor(null);
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
    
    setNewDistributor({ ...newDistributor, distributor_logo: file });
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
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
            
            {(user?.role === 'admin' || user?.role === 'manufacturer') && (
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddDistributorModalOpen(true);
                }}
                className="w-full sm:w-auto bg-coolant-400 hover:bg-coolant-500 flex items-center gap-2"
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-400"></div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Distributor Name</th>
                      <th>City</th>
                      <th>Primary Contact</th>
                      <th>Primary Number</th>
                      <th>Email</th>
                      <th>GST Number</th>
                      <th>Distributor Category</th>
                      <th>Logo</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDistributors.length > 0 ? (
                      filteredDistributors.map((distributor) => (
                        <tr key={distributor.id}>
                          <td className="font-medium">{distributor.distributor_name}</td>
                          <td>{distributor.city}</td>
                          <td>{distributor.primary_contact_person}</td>
                          <td>{distributor.primary_number}</td>
                          <td>{distributor.email}</td>
                          <td>{distributor.gst_number}</td>
                          <td>{distributor.distributor_category}</td>
                          <td>
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                              <img 
                                src={distributor.distributor_logo || '/placeholder.svg'} 
                                alt={`${distributor.distributor_name} logo`} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              {(user?.role === 'admin' || user?.role === 'manufacturer') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditDistributor(distributor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {user?.role === 'admin' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteDistributor(distributor.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center py-4 text-gray-500">
                          No distributors found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredDistributors.length} of {distributors.length} distributors
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Add/Edit Distributor Modal */}
      <Dialog open={isAddDistributorModalOpen} onOpenChange={setIsAddDistributorModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Distributor' : 'Add New Distributor'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? `Update the distributor information for ${selectedDistributor?.distributor_name}.`
                : 'Fill in the distributor information below. Required fields are marked with *.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[calc(80vh-200px)] overflow-y-auto py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distributor-name" className="required">Distributor Name</Label>
                <Input 
                  id="distributor-name" 
                  placeholder="Enter distributor name"
                  value={newDistributor.distributor_name}
                  onChange={(e) => setNewDistributor({...newDistributor, distributor_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="required">City</Label>
                <Input 
                  id="city" 
                  placeholder="Enter city"
                  value={newDistributor.city}
                  onChange={(e) => setNewDistributor({...newDistributor, city: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="required">Address</Label>
                <Input 
                  id="address" 
                  placeholder="Enter complete address"
                  value={newDistributor.address}
                  onChange={(e) => setNewDistributor({...newDistributor, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-contact" className="required">Primary Contact Person</Label>
                <Input 
                  id="primary-contact" 
                  placeholder="Enter primary contact name"
                  value={newDistributor.primary_contact_person}
                  onChange={(e) => setNewDistributor({...newDistributor, primary_contact_person: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-mobile" className="required">Primary Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input 
                    id="primary-mobile" 
                    className="rounded-l-none"
                    placeholder="10-digit mobile number"
                    value={newDistributor.primary_mobile_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewDistributor({...newDistributor, primary_mobile_number: value});
                      if (newDistributor.useAsWhatsapp) {
                        setNewDistributor({...newDistributor, primary_mobile_number: value, whatsapp_number: value});
                      }
                    }}
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2 flex items-center space-x-2">
                <Checkbox 
                  id="use-as-whatsapp" 
                  checked={newDistributor.useAsWhatsapp}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setNewDistributor({...newDistributor, useAsWhatsapp: true, whatsapp_number: newDistributor.primary_mobile_number});
                    } else {
                      setNewDistributor({...newDistributor, useAsWhatsapp: false});
                    }
                  }}
                />
                <Label
                  htmlFor="use-as-whatsapp"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Use Primary Mobile Number as WhatsApp Number
                </Label>
              </div>
              
              {!newDistributor.useAsWhatsapp && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="whatsapp" className="required">WhatsApp Communication Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      +91
                    </span>
                    <Input 
                      id="whatsapp" 
                      className="rounded-l-none"
                      placeholder="10-digit WhatsApp number"
                      value={newDistributor.whatsapp_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                        setNewDistributor({...newDistributor, whatsapp_number: value});
                      }}
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="secondary-contact">Secondary Contact Person</Label>
                <Input 
                  id="secondary-contact" 
                  placeholder="Enter secondary contact name (optional)"
                  value={newDistributor.secondary_contact_person}
                  onChange={(e) => setNewDistributor({...newDistributor, secondary_contact_person: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary-mobile">Secondary Mobile Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input 
                    id="secondary-mobile" 
                    className="rounded-l-none"
                    placeholder="10-digit mobile number (optional)"
                    value={newDistributor.secondary_mobile_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewDistributor({...newDistributor, secondary_mobile_number: value});
                    }}
                    type="tel"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="required">Email ID</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Enter email address"
                  value={newDistributor.email}
                  onChange={(e) => setNewDistributor({...newDistributor, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst" className="required">GST Number</Label>
                <Input 
                  id="gst" 
                  placeholder="Enter GST number"
                  value={newDistributor.gst_number}
                  onChange={(e) => setNewDistributor({...newDistributor, gst_number: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="required">Distributor Category</Label>
                <Select 
                  value={newDistributor.distributor_category}
                  onValueChange={(value) => setNewDistributor({...newDistributor, distributor_category: value})}
                >
                  <SelectTrigger id="category">
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
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logo" className="required">Distributor Logo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    {previewLogo ? (
                      <div className="relative w-32 h-32 overflow-hidden rounded-lg">
                        <img 
                          src={previewLogo} 
                          alt="Logo preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-white rounded-full h-6 w-6"
                          onClick={() => {
                            setPreviewLogo('');
                            setNewDistributor({...newDistributor, distributor_logo: null});
                          }}
                        >
                          <Trash className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-sm text-gray-500">
                      <label
                        htmlFor="logo-upload"
                        className="relative cursor-pointer bg-coolant-100 text-coolant-600 px-4 py-2 rounded-md font-medium hover:bg-coolant-200 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-coolant-500"
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
                      <p className="text-xs mt-1">JPG or PNG only (max. 2MB)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
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
              onClick={handleAddDistributor}
              disabled={
                !newDistributor.distributor_name ||
                !newDistributor.city ||
                !newDistributor.address ||
                !newDistributor.primary_contact_person ||
                !newDistributor.primary_mobile_number ||
                (!newDistributor.useAsWhatsapp && !newDistributor.whatsapp_number) ||
                !newDistributor.email ||
                !newDistributor.gst_number ||
                !newDistributor.distributor_category ||
                (!previewLogo && !isEditMode)
              }
              className="bg-coolant-400 hover:bg-coolant-500"
            >
              {isEditMode ? 'Update Distributor' : 'Add Distributor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DistributorManagement;
