
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, Search, Filter, Eye, MessageSquare, Plus, RefreshCcw, Trash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Mock data for readings
const mockReadings = [
  {
    id: 'R001',
    clientName: 'Acme Industries',
    machineName: 'CNC Mill XL-500',
    raisedBy: 'John Smith',
    designation: 'Operator',
    status: 'Pending',
    oilRefractometer: 5.2,
    oilPh: 7.3,
    waterPh: 6.8,
    machineType: 'Mill',
    metalType: 'Aluminum',
    date: '2025-03-28'
  },
  {
    id: 'R002',
    clientName: 'TechFab Solutions',
    machineName: 'Lathe TL-200',
    raisedBy: 'Emma Johnson',
    designation: 'Technician',
    status: 'Completed',
    oilRefractometer: 4.8,
    oilPh: 7.1,
    waterPh: 6.9,
    machineType: 'Lathe',
    metalType: 'Steel',
    date: '2025-03-27'
  },
  {
    id: 'R003',
    clientName: 'Precision Manufacturing',
    machineName: 'Drill Press DP-100',
    raisedBy: 'Michael Wilson',
    designation: 'Supervisor',
    status: 'Pending',
    oilRefractometer: 5.5,
    oilPh: 7.4,
    waterPh: 6.7,
    machineType: 'Drill',
    metalType: 'Stainless Steel',
    date: '2025-03-25'
  },
  {
    id: 'R004',
    clientName: 'Global Machining Inc.',
    machineName: 'Grinder G-300',
    raisedBy: 'Sarah Davis',
    designation: 'Operator',
    status: 'Not In Use',
    oilRefractometer: null,
    oilPh: null,
    waterPh: null,
    machineType: 'Grinder',
    metalType: 'Cast Iron',
    date: '2025-03-24'
  },
  {
    id: 'R005',
    clientName: 'Elite Engineering',
    machineName: 'Plasma Cutter PC-500',
    raisedBy: 'David Brown',
    designation: 'Technician',
    status: 'Completed',
    oilRefractometer: 5.0,
    oilPh: 7.2,
    waterPh: 6.8,
    machineType: 'Cutter',
    metalType: 'Titanium',
    date: '2025-03-23'
  }
];

const Dashboard = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [readings, setReadings] = useState(mockReadings);
  const [isAddReadingModalOpen, setIsAddReadingModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentReading, setCurrentReading] = useState<any>(null);
  const [uniqueCode, setUniqueCode] = useState('');
  const [isMachineNotInUse, setIsMachineNotInUse] = useState(false);
  const [readingValues, setReadingValues] = useState({
    oilRefractometer: '',
    oilPh: '',
    waterPh: '',
    oilTopUp: '',
    waterInput: ''
  });
  
  // Role-based filtering of readings
  const getFilteredReadings = () => {
    let filtered = [...readings];
    
    // Filter by role
    if (user?.role === 'client') {
      // Clients only see their own readings
      filtered = filtered.filter(r => r.clientName === 'Acme Industries'); // Mock client name
    } else if (user?.role === 'employee') {
      // Employees only see their own readings
      filtered = filtered.filter(r => r.raisedBy === 'John Smith'); // Mock employee name
    } else if (user?.role === 'manufacturer') {
      // Manufacturers see all readings
      // No additional filtering needed
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.id.toLowerCase().includes(term) ||
        r.clientName.toLowerCase().includes(term) ||
        r.machineName.toLowerCase().includes(term) ||
        r.raisedBy.toLowerCase().includes(term)
      );
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    return filtered;
  };
  
  const filteredReadings = getFilteredReadings();
  
  const handleOpenResponseModal = (reading: any) => {
    setCurrentReading(reading);
    setIsResponseModalOpen(true);
  };
  
  const handleOpenViewModal = (reading: any) => {
    setCurrentReading(reading);
    setIsViewModalOpen(true);
  };
  
  const handleAddReading = () => {
    // In a real app, this would submit to the server
    if (isMachineNotInUse) {
      // Add a machine not in use reading
      const newReading = {
        id: `R00${readings.length + 1}`,
        clientName: 'Acme Industries',
        machineName: `Machine ${uniqueCode}`,
        raisedBy: user?.fullName || 'Unknown User',
        designation: user?.designation || 'Employee',
        status: 'Not In Use',
        oilRefractometer: null,
        oilPh: null,
        waterPh: null,
        machineType: 'Unknown',
        metalType: 'Unknown',
        date: new Date().toISOString().split('T')[0]
      };
      
      setReadings([newReading, ...readings]);
    } else {
      // Add a normal reading
      const newReading = {
        id: `R00${readings.length + 1}`,
        clientName: 'Acme Industries',
        machineName: `Machine ${uniqueCode}`,
        raisedBy: user?.fullName || 'Unknown User',
        designation: user?.designation || 'Employee',
        status: 'Pending',
        oilRefractometer: parseFloat(readingValues.oilRefractometer),
        oilPh: parseFloat(readingValues.oilPh),
        waterPh: parseFloat(readingValues.waterPh),
        machineType: 'Mill', // Default for demo
        metalType: 'Steel', // Default for demo
        date: new Date().toISOString().split('T')[0]
      };
      
      setReadings([newReading, ...readings]);
    }
    
    // Reset form and close modal
    setUniqueCode('');
    setIsMachineNotInUse(false);
    setReadingValues({
      oilRefractometer: '',
      oilPh: '',
      waterPh: '',
      oilTopUp: '',
      waterInput: ''
    });
    setIsAddReadingModalOpen(false);
  };
  
  const handleSubmitResponse = () => {
    // In a real app, this would submit to the server
    const updatedReadings = readings.map(r => {
      if (r.id === currentReading.id) {
        return {
          ...r,
          status: 'Completed'
        };
      }
      return r;
    });
    
    setReadings(updatedReadings);
    setIsResponseModalOpen(false);
  };
  
  const handleDeleteReading = (readingId: string) => {
    setReadings(readings.filter(r => r.id !== readingId));
  };

  return (
    <Layout openAddReadingModal={() => setIsAddReadingModalOpen(true)}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-coolant-800">Dashboard</h1>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search readings..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="not in use">Not In Use</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Readings</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Readings</CardTitle>
                <CardDescription>
                  View and manage all coolant readings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-20">S.No</th>
                        <th>Reading ID</th>
                        <th>Client Name</th>
                        <th>Machine Name</th>
                        <th>Raised By</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings.length > 0 ? (
                        filteredReadings.map((reading, index) => (
                          <tr key={reading.id}>
                            <td>{index + 1}</td>
                            <td>{reading.id}</td>
                            <td>{reading.clientName}</td>
                            <td>{reading.machineName}</td>
                            <td>{reading.raisedBy}</td>
                            <td>{reading.designation}</td>
                            <td>
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${reading.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''}
                                  ${reading.status === 'Completed' ? 'bg-green-50 text-green-800 border-green-200' : ''}
                                  ${reading.status === 'Not In Use' ? 'bg-gray-50 text-gray-800 border-gray-200' : ''}
                                `}
                              >
                                {reading.status}
                              </Badge>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end items-center space-x-2">
                                {reading.status === 'Pending' && (
                                  ['manager', 'distributor'].includes(user?.role || '') && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleOpenResponseModal(reading)}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleOpenViewModal(reading)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                      >
                                        <RefreshCcw className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )
                                )}
                                
                                {reading.status === 'Completed' && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleOpenResponseModal(reading)}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleOpenViewModal(reading)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {['admin', 'manager', 'distributor'].includes(user?.role || '') && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleDeleteReading(reading.id)}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </>
                                )}
                                
                                {reading.status === 'Not In Use' && (
                                  <span className="text-sm text-gray-400">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-4 text-gray-500">
                            No readings found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Readings</CardTitle>
                <CardDescription>
                  Readings that require action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-20">S.No</th>
                        <th>Reading ID</th>
                        <th>Client Name</th>
                        <th>Machine Name</th>
                        <th>Raised By</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings
                        .filter(r => r.status === 'Pending')
                        .map((reading, index) => (
                          <tr key={reading.id}>
                            <td>{index + 1}</td>
                            <td>{reading.id}</td>
                            <td>{reading.clientName}</td>
                            <td>{reading.machineName}</td>
                            <td>{reading.raisedBy}</td>
                            <td>{reading.designation}</td>
                            <td>
                              <Badge 
                                variant="outline" 
                                className="bg-yellow-50 text-yellow-800 border-yellow-200"
                              >
                                {reading.status}
                              </Badge>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end items-center space-x-2">
                                {['manager', 'distributor'].includes(user?.role || '') && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleOpenResponseModal(reading)}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleOpenViewModal(reading)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                    >
                                      <RefreshCcw className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Completed Readings</CardTitle>
                <CardDescription>
                  Readings that have been addressed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-20">S.No</th>
                        <th>Reading ID</th>
                        <th>Client Name</th>
                        <th>Machine Name</th>
                        <th>Raised By</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReadings
                        .filter(r => r.status === 'Completed')
                        .map((reading, index) => (
                          <tr key={reading.id}>
                            <td>{index + 1}</td>
                            <td>{reading.id}</td>
                            <td>{reading.clientName}</td>
                            <td>{reading.machineName}</td>
                            <td>{reading.raisedBy}</td>
                            <td>{reading.designation}</td>
                            <td>
                              <Badge 
                                variant="outline" 
                                className="bg-green-50 text-green-800 border-green-200"
                              >
                                {reading.status}
                              </Badge>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenResponseModal(reading)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenViewModal(reading)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {['admin', 'manager', 'distributor'].includes(user?.role || '') && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteReading(reading.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Reading Modal */}
      <Dialog open={isAddReadingModalOpen} onOpenChange={setIsAddReadingModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Reading</DialogTitle>
            <DialogDescription>
              Enter the machine code and reading values below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unique-code">Machine Unique Code</Label>
                <Input 
                  id="unique-code" 
                  placeholder="Enter machine unique code" 
                  value={uniqueCode}
                  onChange={(e) => setUniqueCode(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="machine-not-in-use" 
                  checked={isMachineNotInUse} 
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setIsMachineNotInUse(true);
                    } else {
                      setIsMachineNotInUse(false);
                    }
                  }}
                />
                <label
                  htmlFor="machine-not-in-use"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Machine Not in Use
                </label>
              </div>
              
              {!isMachineNotInUse && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oil-refractometer">Oil Refractometer %</Label>
                      <Input 
                        id="oil-refractometer" 
                        type="number" 
                        placeholder="Enter value" 
                        value={readingValues.oilRefractometer}
                        onChange={(e) => setReadingValues({...readingValues, oilRefractometer: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oil-ph">Oil pH Level</Label>
                      <Input 
                        id="oil-ph" 
                        type="number" 
                        placeholder="Enter value" 
                        value={readingValues.oilPh}
                        onChange={(e) => setReadingValues({...readingValues, oilPh: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="water-ph">Water pH Level</Label>
                      <Input 
                        id="water-ph" 
                        type="number" 
                        placeholder="Enter value" 
                        value={readingValues.waterPh}
                        onChange={(e) => setReadingValues({...readingValues, waterPh: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Critical Reading</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="oil-top-up">Oil Top-Up</Label>
                        <Input 
                          id="oil-top-up" 
                          type="number" 
                          placeholder="Enter value" 
                          value={readingValues.oilTopUp}
                          onChange={(e) => setReadingValues({...readingValues, oilTopUp: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="water-input">Water Input</Label>
                        <Input 
                          id="water-input" 
                          type="number" 
                          placeholder="Enter value" 
                          value={readingValues.waterInput}
                          onChange={(e) => setReadingValues({...readingValues, waterInput: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddReadingModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddReading}
              disabled={!uniqueCode}
              className="bg-coolant-400 hover:bg-coolant-500"
            >
              Submit Reading
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Response Modal */}
      <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manager Response</DialogTitle>
            <DialogDescription>
              Update values and provide response for reading {currentReading?.id}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Water pH Level (Pre-populated)</Label>
                <Input 
                  value={currentReading?.waterPh || '-'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Type of Machine (Pre-populated)</Label>
                <Input 
                  value={currentReading?.machineType || '-'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Type of Metal (Pre-populated)</Label>
                <Input 
                  value={currentReading?.metalType || '-'} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Manager Response</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-oil-refractometer">Post Oil Refractometer %</Label>
                  <Input 
                    id="post-oil-refractometer" 
                    type="number" 
                    placeholder="Enter value" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-oil-ph">Post Oil pH Level</Label>
                  <Input 
                    id="post-oil-ph" 
                    type="number" 
                    placeholder="Enter value" 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Add Top Up</h3>
                <Button variant="outline" size="sm" className="h-8 flex items-center gap-1">
                  <Plus className="h-3 w-3" />
                  <span>Add Top Up</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-oil-top-up">Post Oil Top-Up</Label>
                  <Input 
                    id="post-oil-top-up" 
                    type="number" 
                    placeholder="Enter value" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-water">Post Water</Label>
                  <Input 
                    id="post-water" 
                    type="number" 
                    placeholder="Enter value" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitResponse}
              className="bg-coolant-400 hover:bg-coolant-500"
            >
              Submit Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Reading Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Reading Details</DialogTitle>
            <DialogDescription>
              Complete details for reading {currentReading?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Reading ID</Label>
                <p className="font-medium">{currentReading?.id}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Status</Label>
                <div>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${currentReading?.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''}
                      ${currentReading?.status === 'Completed' ? 'bg-green-50 text-green-800 border-green-200' : ''}
                      ${currentReading?.status === 'Not In Use' ? 'bg-gray-50 text-gray-800 border-gray-200' : ''}
                    `}
                  >
                    {currentReading?.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Client Name</Label>
                <p className="font-medium">{currentReading?.clientName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Machine Name</Label>
                <p className="font-medium">{currentReading?.machineName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Raised By</Label>
                <p className="font-medium">{currentReading?.raisedBy}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Designation</Label>
                <p className="font-medium">{currentReading?.designation}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Date</Label>
                <p className="font-medium">{currentReading?.date}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Reading Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Oil Refractometer %</Label>
                  <p className="font-medium">{currentReading?.oilRefractometer ?? '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Oil pH Level</Label>
                  <p className="font-medium">{currentReading?.oilPh ?? '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Water pH Level</Label>
                  <p className="font-medium">{currentReading?.waterPh ?? '-'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-4">Machine Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Machine Type</Label>
                  <p className="font-medium">{currentReading?.machineType ?? '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Metal Type</Label>
                  <p className="font-medium">{currentReading?.metalType ?? '-'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
