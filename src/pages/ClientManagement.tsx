
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

// Define type for client data
interface Client {
  id: number;
  client_name: string;
  city: string;
  address: string;
  primary_contact_person: string;
  primary_number: string;
  secondary_contact_person: string;
  secondary_number: string;
  email: string;
  gst_number: string;
  types_of_metals: string;
  client_category: string;
  whatsapp_number: string;
  client_logo: string;
  distributor_id?: number;
}

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
  const [clients, setClients] = useState<Client[]>([]);
  const [distributors, setDistributors] = useState<{id: number, name: string}[]>([]);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    client_name: '',
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
    types_of_metals: [] as string[],
    client_category: '',
    distributor_id: '',
    client_logo: null as File | null
  });
  const [previewLogo, setPreviewLogo] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Load clients from API
  useEffect(() => {
    fetchClients();
    fetchDistributors();
  }, []);
  
  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDistributors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/distributors/list', {
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
    }
  };
  
  // Filter clients based on role and search term
  const getFilteredClients = () => {
    let filtered = [...clients];
    
    // Role-based filtering
    if (user?.role === 'client') {
      // Clients only see their own record
      const clientGST = user.companyName; // Assumes company name holds GST for clients
      filtered = filtered.filter(c => c.gst_number === clientGST);
    }
    
    // Search term filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.client_name.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        c.primary_contact_person.toLowerCase().includes(term) ||
        c.gst_number.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };
  
  const filteredClients = getFilteredClients();
  
  const handleAddClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add all client details to formData
      formData.append('client_name', newClient.client_name);
      formData.append('city', newClient.city);
      formData.append('address', newClient.address);
      formData.append('primary_contact_person', newClient.primary_contact_person);
      formData.append('primary_mobile_number', newClient.primary_mobile_number);
      
      if (newClient.useAsWhatsapp) {
        formData.append('whatsapp_number', newClient.primary_mobile_number);
      } else {
        formData.append('whatsapp_number', newClient.whatsapp_number);
      }
      
      formData.append('secondary_contact_person', newClient.secondary_contact_person || '');
      formData.append('secondary_mobile_number', newClient.secondary_mobile_number || '');
      formData.append('email', newClient.email);
      formData.append('gst_number', newClient.gst_number);
      formData.append('types_of_metals', newClient.types_of_metals.join(', '));
      formData.append('client_category', newClient.client_category);
      formData.append('distributor_id', newClient.distributor_id);
      
      if (newClient.client_logo) {
        formData.append('client_logo', newClient.client_logo);
      }
      
      let url = 'http://localhost:5000/api/clients';
      let method = 'POST';
      
      if (isEditMode && selectedClient) {
        url = `http://localhost:5000/api/clients/${selectedClient.id}`;
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
        throw new Error(isEditMode ? 'Failed to update client' : 'Failed to add client');
      }
      
      // Refresh the client list
      await fetchClients();
      
      toast.success(isEditMode ? 'Client updated successfully' : 'Client added successfully');
      
      // Reset form and close modal
      resetForm();
      setIsAddClientModalOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(isEditMode ? 'Failed to update client' : 'Failed to add client');
    }
  };
  
  const handleEditClient = (client: Client) => {
    setIsEditMode(true);
    setSelectedClient(client);
    
    // Parse metals from comma-separated string to array
    const metalsArray = client.types_of_metals.split(', ').map((m: string) => m.trim());
    
    // Set form values
    setNewClient({
      client_name: client.client_name,
      city: client.city,
      address: client.address || '',
      primary_contact_person: client.primary_contact_person,
      primary_mobile_number: client.primary_number.replace('+91', ''),
      useAsWhatsapp: client.primary_number === client.whatsapp_number,
      whatsapp_number: client.whatsapp_number.replace('+91', ''),
      secondary_contact_person: client.secondary_contact_person !== '-' ? client.secondary_contact_person : '',
      secondary_mobile_number: client.secondary_number !== '-' ? client.secondary_number.replace('+91', '') : '',
      email: client.email,
      gst_number: client.gst_number,
      types_of_metals: metalsArray,
      client_category: client.client_category,
      distributor_id: client.distributor_id ? client.distributor_id.toString() : '',
      client_logo: null
    });
    
    setPreviewLogo(client.client_logo);
    
    setIsAddClientModalOpen(true);
  };
  
  const handleDeleteClient = async (clientId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      
      // Refresh the client list
      await fetchClients();
      
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };
  
  const resetForm = () => {
    setNewClient({
      client_name: '',
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
      types_of_metals: [],
      client_category: '',
      distributor_id: '',
      client_logo: null
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
      toast.error('File type not allowed. Please upload a JPG or PNG image.');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }
    
    setNewClient({ ...newClient, client_logo: file });
    
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
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-400"></div>
              </div>
            ) : (
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
                          <td className="font-medium">{client.client_name}</td>
                          <td>{client.city}</td>
                          <td>{client.primary_contact_person}</td>
                          <td>{client.primary_number}</td>
                          <td>{client.email}</td>
                          <td>{client.gst_number}</td>
                          <td>{client.client_category}</td>
                          <td>
                            <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-100">
                              <img 
                                src={client.client_logo || '/placeholder.svg'} 
                                alt={`${client.client_name} logo`} 
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
                                disabled={user?.role === 'client' && client.gst_number !== user.companyName}
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
            )}
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
                ? `Update the client information for ${selectedClient?.client_name}.`
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
                  value={newClient.client_name}
                  onChange={(e) => setNewClient({...newClient, client_name: e.target.value})}
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
                  value={newClient.primary_contact_person}
                  onChange={(e) => setNewClient({...newClient, primary_contact_person: e.target.value})}
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
                    value={newClient.primary_mobile_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewClient({...newClient, primary_mobile_number: value});
                      if (newClient.useAsWhatsapp) {
                        setNewClient({...newClient, primary_mobile_number: value, whatsapp_number: value});
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
                      setNewClient({...newClient, useAsWhatsapp: true, whatsapp_number: newClient.primary_mobile_number});
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
                      value={newClient.whatsapp_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                        setNewClient({...newClient, whatsapp_number: value});
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
                  value={newClient.secondary_contact_person}
                  onChange={(e) => setNewClient({...newClient, secondary_contact_person: e.target.value})}
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
                    value={newClient.secondary_mobile_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      setNewClient({...newClient, secondary_mobile_number: value});
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
                  value={newClient.gst_number}
                  onChange={(e) => setNewClient({...newClient, gst_number: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metals" className="required">Types of Metals</Label>
                <Select 
                  value={newClient.types_of_metals.join(',')}
                  onValueChange={(value) => {
                    const values = value.split(',').filter(v => v);
                    setNewClient({...newClient, types_of_metals: values});
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
                {newClient.types_of_metals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newClient.types_of_metals.map((metal) => (
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
                  value={newClient.client_category}
                  onValueChange={(value) => setNewClient({...newClient, client_category: value})}
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
              
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'distributor') && (
                <div className="space-y-2">
                  <Label htmlFor="distributor" className="required">Assign Distributor</Label>
                  <Select 
                    value={newClient.distributor_id}
                    onValueChange={(value) => setNewClient({...newClient, distributor_id: value})}
                  >
                    <SelectTrigger id="distributor">
                      <SelectValue placeholder="Select distributor" />
                    </SelectTrigger>
                    <SelectContent>
                      {distributors.map((distributor) => (
                        <SelectItem key={distributor.id} value={distributor.id.toString()}>
                          {distributor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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
                            setNewClient({...newClient, client_logo: null});
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
                !newClient.client_name ||
                !newClient.city ||
                !newClient.address ||
                !newClient.primary_contact_person ||
                !newClient.primary_mobile_number ||
                (!newClient.useAsWhatsapp && !newClient.whatsapp_number) ||
                !newClient.email ||
                !newClient.gst_number ||
                newClient.types_of_metals.length === 0 ||
                !newClient.client_category ||
                (user?.role !== 'client' && !newClient.distributor_id) ||
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
