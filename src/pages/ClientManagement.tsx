
import { useState } from 'react';
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

// Mock data for clients
const mockClients = [
  {
    id: 1,
    clientName: 'Acme Industries',
    city: 'New York',
    primaryContactPerson: 'John Smith',
    primaryNumber: '+918765432101',
    secondaryContactPerson: 'Jane Doe',
    secondaryNumber: '+918765432102',
    email: 'contact@acme.com',
    gstNumber: 'GST1234567890',
    typesOfMetals: 'Aluminum, Steel, Copper',
    clientCategory: 'Retail',
    whatsappNumber: '+918765432101',
    clientLogo: '/placeholder.svg'
  },
  {
    id: 2,
    clientName: 'TechFab Solutions',
    city: 'Chicago',
    primaryContactPerson: 'Emma Johnson',
    primaryNumber: '+918765432103',
    secondaryContactPerson: 'Michael Williams',
    secondaryNumber: '+918765432104',
    email: 'contact@techfab.com',
    gstNumber: 'GST2345678901',
    typesOfMetals: 'Steel, Titanium',
    clientCategory: 'Wholesale',
    whatsappNumber: '+918765432103',
    clientLogo: '/placeholder.svg'
  },
  {
    id: 3,
    clientName: 'Precision Manufacturing',
    city: 'Houston',
    primaryContactPerson: 'David Brown',
    primaryNumber: '+918765432105',
    secondaryContactPerson: 'Sarah Miller',
    secondaryNumber: '+918765432106',
    email: 'contact@precision.com',
    gstNumber: 'GST3456789012',
    typesOfMetals: 'Stainless Steel, Aluminum',
    clientCategory: 'Distributor',
    whatsappNumber: '+918765432105',
    clientLogo: '/placeholder.svg'
  },
  {
    id: 4,
    clientName: 'Global Machining Inc.',
    city: 'Los Angeles',
    primaryContactPerson: 'Robert Wilson',
    primaryNumber: '+918765432107',
    secondaryContactPerson: 'Jennifer Davis',
    secondaryNumber: '+918765432108',
    email: 'contact@globalmach.com',
    gstNumber: 'GST4567890123',
    typesOfMetals: 'Cast Iron, Aluminum',
    clientCategory: 'Retail',
    whatsappNumber: '+918765432107',
    clientLogo: '/placeholder.svg'
  },
  {
    id: 5,
    clientName: 'Elite Engineering',
    city: 'Miami',
    primaryContactPerson: 'Thomas Anderson',
    primaryNumber: '+918765432109',
    secondaryContactPerson: 'Lisa Garcia',
    secondaryNumber: '+918765432110',
    email: 'contact@eliteeng.com',
    gstNumber: 'GST5678901234',
    typesOfMetals: 'Titanium, Steel',
    clientCategory: 'Wholesale',
    whatsappNumber: '+918765432109',
    clientLogo: '/placeholder.svg'
  }
];

const metalOptions = [
  { label: 'Aluminum', value: 'Aluminum' },
  { label: 'Steel', value: 'Steel' },
  { label: 'Stainless Steel', value: 'Stainless Steel' },
  { label: 'Copper', value: 'Copper' },
  { label: 'Titanium', value: 'Titanium' },
  { label: 'Cast Iron', value: 'Cast Iron' }
];

const categoryOptions = [
  { label: 'Retail', value: 'Retail' },
  { label: 'Wholesale', value: 'Wholesale' },
  { label: 'Distributor', value: 'Distributor' }
];

const ClientManagement = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState(mockClients);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    clientName: '',
    city: '',
    address: '',
    primaryContactPerson: '',
    primaryMobileNumber: '',
    useAsWhatsapp: true,
    whatsappNumber: '',
    secondaryContactPerson: '',
    secondaryMobileNumber: '',
    email: '',
    gstNumber: '',
    typesOfMetals: [] as string[],
    clientCategory: '',
    clientLogo: null as File | null
  });
  const [previewLogo, setPreviewLogo] = useState('');
  
  // Filter clients based on role and search term
  const getFilteredClients = () => {
    let filtered = [...clients];
    
    // Role-based filtering
    if (user?.role === 'client') {
      // Clients only see their own record
      filtered = filtered.filter(c => c.id === 1); // For demo, assume client user is id 1
    }
    
    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.clientName.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.primaryContactPerson.toLowerCase().includes(term) ||
        c.gstNumber.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };
  
  const filteredClients = getFilteredClients();
  
  const handleAddClient = () => {
    // For demo purposes, we'll just add a client with the form data
    const newClientId = clients.length + 1;
    
    const clientToAdd = {
      id: newClientId,
      clientName: newClient.clientName,
      city: newClient.city,
      primaryContactPerson: newClient.primaryContactPerson,
      primaryNumber: '+91' + newClient.primaryMobileNumber,
      secondaryContactPerson: newClient.secondaryContactPerson || '-',
      secondaryNumber: newClient.secondaryMobileNumber ? ('+91' + newClient.secondaryMobileNumber) : '-',
      email: newClient.email,
      gstNumber: newClient.gstNumber,
      typesOfMetals: newClient.typesOfMetals.join(', '),
      clientCategory: newClient.clientCategory,
      whatsappNumber: newClient.useAsWhatsapp 
        ? ('+91' + newClient.primaryMobileNumber) 
        : ('+91' + newClient.whatsappNumber),
      clientLogo: previewLogo || '/placeholder.svg'
    };
    
    if (isEditMode && selectedClient) {
      // Update existing client
      const updatedClients = clients.map(c => {
        if (c.id === selectedClient.id) {
          return { ...clientToAdd, id: selectedClient.id };
        }
        return c;
      });
      setClients(updatedClients);
    } else {
      // Add new client
      setClients([...clients, clientToAdd]);
    }
    
    // Reset form and close modal
    resetForm();
    setIsAddClientModalOpen(false);
  };
  
  const handleEditClient = (client: any) => {
    setIsEditMode(true);
    setSelectedClient(client);
    
    // Parse metals from comma-separated string to array
    const metalsArray = client.typesOfMetals.split(', ').map((m: string) => m.trim());
    
    // Set form values
    setNewClient({
      clientName: client.clientName,
      city: client.city,
      address: client.address || '',
      primaryContactPerson: client.primaryContactPerson,
      primaryMobileNumber: client.primaryNumber.replace('+91', ''),
      useAsWhatsapp: client.primaryNumber === client.whatsappNumber,
      whatsappNumber: client.whatsappNumber.replace('+91', ''),
      secondaryContactPerson: client.secondaryContactPerson !== '-' ? client.secondaryContactPerson : '',
      secondaryMobileNumber: client.secondaryNumber !== '-' ? client.secondaryNumber.replace('+91', '') : '',
      email: client.email,
      gstNumber: client.gstNumber,
      typesOfMetals: metalsArray,
      clientCategory: client.clientCategory,
      clientLogo: null
    });
    
    setPreviewLogo(client.clientLogo);
    
    setIsAddClientModalOpen(true);
  };
  
  const handleDeleteClient = (clientId: number) => {
    // In a real app, we would make an API call to delete the client
    setClients(clients.filter(c => c.id !== clientId));
  };
  
  const resetForm = () => {
    setNewClient({
      clientName: '',
      city: '',
      address: '',
      primaryContactPerson: '',
      primaryMobileNumber: '',
      useAsWhatsapp: true,
      whatsappNumber: '',
      secondaryContactPerson: '',
      secondaryMobileNumber: '',
      email: '',
      gstNumber: '',
      typesOfMetals: [],
      clientCategory: '',
      clientLogo: null
    });
    setPreviewLogo('');
    setIsEditMode(false);
    setSelectedClient(null);
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
    
    setNewClient({ ...newClient, clientLogo: file });
    
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
          <h1 className="text-3xl font-bold text-coolant-800">Client Management</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {user?.role !== 'client' && (
              <Button 
                onClick={() => {
                  resetForm();
                  setIsAddClientModalOpen(true);
                }}
                className="w-full sm:w-auto bg-coolant-400 hover:bg-coolant-500 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Client</span>
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Clients</CardTitle>
            <CardDescription>
              View and manage all client records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>City</th>
                    <th>Primary Contact</th>
                    <th>Primary Number</th>
                    <th>Email</th>
                    <th>GST Number</th>
                    <th>Client Category</th>
                    <th>Logo</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td className="font-medium">{client.clientName}</td>
                        <td>{client.city}</td>
                        <td>{client.primaryContactPerson}</td>
                        <td>{client.primaryNumber}</td>
                        <td>{client.email}</td>
                        <td>{client.gstNumber}</td>
                        <td>{client.clientCategory}</td>
                        <td>
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                            <img 
                              src={client.clientLogo} 
                              alt={`${client.clientName} logo`} 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditClient(client)}
                              disabled={user?.role === 'client' && client.id !== 1} // For demo, clients can only edit their own
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'distributor') && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
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
                        No clients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-gray-500">
              Showing {filteredClients.length} of {clients.length} clients
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Add/Edit Client Modal */}
      <Dialog open={isAddClientModalOpen} onOpenChange={setIsAddClientModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? `Update the client information for ${selectedClient?.clientName}.`
                : 'Fill in the client information below. Required fields are marked with *.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[calc(80vh-200px)] overflow-y-auto py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client-name" className="required">Client Name</Label>
                <Input 
                  id="client-name" 
                  placeholder="Enter client name"
                  value={newClient.clientName}
                  onChange={(e) => setNewClient({...newClient, clientName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city" className="required">City</Label>
                <Input 
                  id="city" 
                  placeholder="Enter city"
                  value={newClient.city}
                  onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="required">Address</Label>
                <Input 
                  id="address" 
                  placeholder="Enter complete address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-contact" className="required">Primary Contact Person</Label>
                <Input 
                  id="primary-contact" 
                  placeholder="Enter primary contact name"
                  value={newClient.primaryContactPerson}
                  onChange={(e) => setNewClient({...newClient, primaryContactPerson: e.target.value})}
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
                    value={newClient.primaryMobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewClient({...newClient, primaryMobileNumber: value});
                      if (newClient.useAsWhatsapp) {
                        setNewClient({...newClient, primaryMobileNumber: value, whatsappNumber: value});
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
                  checked={newClient.useAsWhatsapp}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setNewClient({...newClient, useAsWhatsapp: true, whatsappNumber: newClient.primaryMobileNumber});
                    } else {
                      setNewClient({...newClient, useAsWhatsapp: false});
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
              
              {!newClient.useAsWhatsapp && (
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
                      value={newClient.whatsappNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                        setNewClient({...newClient, whatsappNumber: value});
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
                  value={newClient.secondaryContactPerson}
                  onChange={(e) => setNewClient({...newClient, secondaryContactPerson: e.target.value})}
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
                    value={newClient.secondaryMobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewClient({...newClient, secondaryMobileNumber: value});
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
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gst" className="required">GST Number</Label>
                <Input 
                  id="gst" 
                  placeholder="Enter GST number"
                  value={newClient.gstNumber}
                  onChange={(e) => setNewClient({...newClient, gstNumber: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metals" className="required">Types of Metals</Label>
                <Select 
                  value={newClient.typesOfMetals.join(',')}
                  onValueChange={(value) => {
                    const values = value.split(',').filter(v => v);
                    setNewClient({...newClient, typesOfMetals: values});
                  }}
                >
                  <SelectTrigger id="metals">
                    <SelectValue placeholder="Select metals" />
                  </SelectTrigger>
                  <SelectContent>
                    {metalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newClient.typesOfMetals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newClient.typesOfMetals.map((metal) => (
                      <span 
                        key={metal}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-coolant-100 text-coolant-800"
                      >
                        {metal}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category" className="required">Client Category</Label>
                <Select 
                  value={newClient.clientCategory}
                  onValueChange={(value) => setNewClient({...newClient, clientCategory: value})}
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
                <Label htmlFor="logo" className="required">Client Logo</Label>
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
                            setNewClient({...newClient, clientLogo: null});
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
                setIsAddClientModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddClient}
              disabled={
                !newClient.clientName ||
                !newClient.city ||
                !newClient.address ||
                !newClient.primaryContactPerson ||
                !newClient.primaryMobileNumber ||
                (!newClient.useAsWhatsapp && !newClient.whatsappNumber) ||
                !newClient.email ||
                !newClient.gstNumber ||
                newClient.typesOfMetals.length === 0 ||
                !newClient.clientCategory ||
                (!previewLogo && !isEditMode)
              }
              className="bg-coolant-400 hover:bg-coolant-500"
            >
              {isEditMode ? 'Update Client' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ClientManagement;
