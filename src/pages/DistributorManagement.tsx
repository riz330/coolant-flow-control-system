
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash, QrCode, Upload, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data for distributors
const mockDistributors = [
  {
    id: 1,
    name: 'Midwest Distribution Co.',
    city: 'Chicago',
    address: '123 Distribution Ave, Chicago, IL 60601',
    primaryContactPerson: 'Michael Johnson',
    primaryNumber: '+918765432110',
    secondaryContactPerson: 'Sarah Williams',
    secondaryNumber: '+918765432111',
    email: 'contact@midwest.com',
    gstNumber: 'GST8901234567',
    category: 'Wholesale',
    whatsappNumber: '+918765432110',
    logo: '/placeholder.svg'
  },
  {
    id: 2,
    name: 'Eastern Supply Ltd.',
    city: 'New York',
    address: '456 Supply St, New York, NY 10001',
    primaryContactPerson: 'Jessica Brown',
    primaryNumber: '+918765432112',
    secondaryContactPerson: 'David Miller',
    secondaryNumber: '+918765432113',
    email: 'contact@eastern.com',
    gstNumber: 'GST9012345678',
    category: 'Retail',
    whatsappNumber: '+918765432112',
    logo: '/placeholder.svg'
  },
  {
    id: 3,
    name: 'Western Logistics',
    city: 'Los Angeles',
    address: '789 Logistics Blvd, Los Angeles, CA 90001',
    primaryContactPerson: 'Robert Smith',
    primaryNumber: '+918765432114',
    secondaryContactPerson: 'Amy Davis',
    secondaryNumber: '+918765432115',
    email: 'contact@western.com',
    gstNumber: 'GST0123456789',
    category: 'Industrial',
    whatsappNumber: '+918765432114',
    logo: '/placeholder.svg'
  },
  {
    id: 4,
    name: 'Southern Distributors Inc.',
    city: 'Houston',
    address: '101 Distribution Way, Houston, TX 77001',
    primaryContactPerson: 'Thomas Wilson',
    primaryNumber: '+918765432116',
    secondaryContactPerson: 'Emily Lee',
    secondaryNumber: '+918765432117',
    email: 'contact@southern.com',
    gstNumber: 'GST1234567890',
    category: 'Commercial',
    whatsappNumber: '+918765432116',
    logo: '/placeholder.svg'
  },
  {
    id: 5,
    name: 'Global Supply Chain',
    city: 'Miami',
    address: '202 Global Ave, Miami, FL 33101',
    primaryContactPerson: 'James Garcia',
    primaryNumber: '+918765432118',
    secondaryContactPerson: 'Lisa Martinez',
    secondaryNumber: '+918765432119',
    email: 'contact@globalsupply.com',
    gstNumber: 'GST2345678901',
    category: 'Wholesale',
    whatsappNumber: '+918765432118',
    logo: '/placeholder.svg'
  }
];

const categoryOptions = [
  { label: 'Retail', value: 'Retail' },
  { label: 'Wholesale', value: 'Wholesale' },
  { label: 'Industrial', value: 'Industrial' },
  { label: 'Commercial', value: 'Commercial' }
];

const DistributorManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [distributors, setDistributors] = useState(mockDistributors);
  const [isAddDistributorModalOpen, setIsAddDistributorModalOpen] = useState(false);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newDistributor, setNewDistributor] = useState({
    name: '',
    city: '',
    address: '',
    primaryContactPerson: '',
    primaryMobileNumber: '',
    secondaryContactPerson: '',
    secondaryMobileNumber: '',
    email: '',
    gstNumber: '',
    category: '',
    whatsappNumber: '',
    logo: null as File | null
  });
  const [previewLogo, setPreviewLogo] = useState('');
  
  // Get unique cities for the filter
  const uniqueCities = [...new Set(distributors.map(d => d.city))].sort();
  
  // Check if user can view this page
  if (!['admin', 'manufacturer'].includes(user?.role || '')) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
          <h1 className="text-2xl font-bold text-coolant-800 mb-4">Access Restricted</h1>
          <p className="text-coolant-600">
            You don't have permission to access the Distributor Management page.
          </p>
        </div>
      </Layout>
    );
  }
  
  // Filter distributors based on search and filters
  const getFilteredDistributors = () => {
    let filtered = [...distributors];
    
    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        d.gstNumber.toLowerCase().includes(term)
      );
    }
    
    // Category filtering
    if (categoryFilter) {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }
    
    // City filtering
    if (cityFilter) {
      filtered = filtered.filter(d => d.city === cityFilter);
    }
    
    return filtered;
  };
  
  const filteredDistributors = getFilteredDistributors();
  
  const handleAddDistributor = () => {
    // For demo purposes, we'll just add a distributor with the form data
    const newDistributorId = distributors.length + 1;
    
    const distributorToAdd = {
      id: newDistributorId,
      name: newDistributor.name,
      city: newDistributor.city,
      address: newDistributor.address,
      primaryContactPerson: newDistributor.primaryContactPerson,
      primaryNumber: '+91' + newDistributor.primaryMobileNumber,
      secondaryContactPerson: newDistributor.secondaryContactPerson || '-',
      secondaryNumber: newDistributor.secondaryMobileNumber ? ('+91' + newDistributor.secondaryMobileNumber) : '-',
      email: newDistributor.email,
      gstNumber: newDistributor.gstNumber,
      category: newDistributor.category,
      whatsappNumber: '+91' + newDistributor.whatsappNumber,
      logo: previewLogo || '/placeholder.svg'
    };
    
    if (isEditMode && selectedDistributor) {
      // Update existing distributor
      const updatedDistributors = distributors.map(d => {
        if (d.id === selectedDistributor.id) {
          return { ...distributorToAdd, id: selectedDistributor.id };
        }
        return d;
      });
      setDistributors(updatedDistributors);
    } else {
      // Add new distributor
      setDistributors([...distributors, distributorToAdd]);
    }
    
    // Reset form and close modal
    resetForm();
    setIsAddDistributorModalOpen(false);
  };
  
  const handleEditDistributor = (distributor: any) => {
    setIsEditMode(true);
    setSelectedDistributor(distributor);
    
    // Set form values
    setNewDistributor({
      name: distributor.name,
      city: distributor.city,
      address: distributor.address,
      primaryContactPerson: distributor.primaryContactPerson,
      primaryMobileNumber: distributor.primaryNumber.replace('+91', ''),
      secondaryContactPerson: distributor.secondaryContactPerson !== '-' ? distributor.secondaryContactPerson : '',
      secondaryMobileNumber: distributor.secondaryNumber !== '-' ? distributor.secondaryNumber.replace('+91', '') : '',
      email: distributor.email,
      gstNumber: distributor.gstNumber,
      category: distributor.category,
      whatsappNumber: distributor.whatsappNumber.replace('+91', ''),
      logo: null
    });
    
    setPreviewLogo(distributor.logo);
    
    setIsAddDistributorModalOpen(true);
  };
  
  const handleShowQrCode = (distributor: any) => {
    setSelectedDistributor(distributor);
    setIsQrCodeModalOpen(true);
  };
  
  const handleDeleteDistributor = (distributorId: number) => {
    setDistributors(distributors.filter(d => d.id !== distributorId));
  };
  
  const resetForm = () => {
    setNewDistributor({
      name: '',
      city: '',
      address: '',
      primaryContactPerson: '',
      primaryMobileNumber: '',
      secondaryContactPerson: '',
      secondaryMobileNumber: '',
      email: '',
      gstNumber: '',
      category: '',
      whatsappNumber: '',
      logo: null
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
      alert('File type not allowed. Please upload a JPG or PNG image.');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit.');
      return;
    }
    
    setNewDistributor({ ...newDistributor, logo: file });
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Check if user can edit or add distributors
  const canEditOrAdd = user?.role === 'admin';
  
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
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="City" />
                  </div>
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
            
            {canEditOrAdd && (
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddDistributorModalOpen(true);
                }}
                className="w-full sm:w-auto bg-coolant-400 hover:bg-coolant-500 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Distributor</span>
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
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Distributor Name</th>
                    <th>City</th>
                    <th>Primary Contact</th>
                    <th>Primary Number</th>
                    <th>Email</th>
                    <th>GST Number</th>
                    <th>Category</th>
                    <th>Logo</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDistributors.length > 0 ? (
                    filteredDistributors.map((distributor, index) => (
                      <tr key={distributor.id}>
                        <td>{index + 1}</td>
                        <td className="font-medium">{distributor.name}</td>
                        <td>{distributor.city}</td>
                        <td>{distributor.primaryContactPerson}</td>
                        <td>{distributor.primaryNumber}</td>
                        <td>{distributor.email}</td>
                        <td>{distributor.gstNumber}</td>
                        <td>{distributor.category}</td>
                        <td>
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                            <img 
                              src={distributor.logo} 
                              alt={`${distributor.name} logo`} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleShowQrCode(distributor)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            
                            {canEditOrAdd && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditDistributor(distributor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteDistributor(distributor.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="text-center py-4 text-gray-500">
                        No distributors found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                ? `Update the distributor information for ${selectedDistributor?.name}.`
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
                  value={newDistributor.name}
                  onChange={(e) => setNewDistributor({...newDistributor, name: e.target.value})}
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
                  value={newDistributor.primaryContactPerson}
                  onChange={(e) => setNewDistributor({...newDistributor, primaryContactPerson: e.target.value})}
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
                    value={newDistributor.primaryMobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewDistributor({...newDistributor, primaryMobileNumber: value});
                    }}
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary-contact">Secondary Contact Person</Label>
                <Input 
                  id="secondary-contact" 
                  placeholder="Enter secondary contact name (optional)"
                  value={newDistributor.secondaryContactPerson}
                  onChange={(e) => setNewDistributor({...newDistributor, secondaryContactPerson: e.target.value})}
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
                    value={newDistributor.secondaryMobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewDistributor({...newDistributor, secondaryMobileNumber: value});
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
                  value={newDistributor.gstNumber}
                  onChange={(e) => setNewDistributor({...newDistributor, gstNumber: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="required">Distributor Category</Label>
                <Select 
                  value={newDistributor.category}
                  onValueChange={(value) => setNewDistributor({...newDistributor, category: value})}
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
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="required">WhatsApp Communication Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <Input 
                    id="whatsapp" 
                    className="rounded-l-none"
                    placeholder="10-digit WhatsApp number"
                    value={newDistributor.whatsappNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewDistributor({...newDistributor, whatsappNumber: value});
                    }}
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                  />
                </div>
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
                            setNewDistributor({...newDistributor, logo: null});
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
                !newDistributor.name ||
                !newDistributor.city ||
                !newDistributor.address ||
                !newDistributor.primaryContactPerson ||
                !newDistributor.primaryMobileNumber ||
                !newDistributor.email ||
                !newDistributor.gstNumber ||
                !newDistributor.category ||
                !newDistributor.whatsappNumber ||
                (!previewLogo && !isEditMode)
              }
              className="bg-coolant-400 hover:bg-coolant-500"
            >
              {isEditMode ? 'Update Distributor' : 'Add Distributor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* QR Code Modal */}
      <Dialog open={isQrCodeModalOpen} onOpenChange={setIsQrCodeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Distributor QR Code</DialogTitle>
            <DialogDescription>
              QR Code for {selectedDistributor?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-64 h-64 bg-white p-4 rounded-lg border">
                {/* In a real app, we would generate an actual QR code */}
                <div className="flex items-center justify-center h-full">
                  <QrCode className="h-32 w-32 text-coolant-800" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="font-medium text-coolant-800">{selectedDistributor?.name}</h3>
                <p className="text-sm text-coolant-600">{selectedDistributor?.city}</p>
              </div>
              
              <Button className="bg-coolant-400 hover:bg-coolant-500">
                Download QR Code
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQrCodeModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DistributorManagement;
