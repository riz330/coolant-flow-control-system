
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PlusCircle, Search, Edit, Trash2, Check, X, User, Filter
} from 'lucide-react';

import { API_URL } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define types
type UserRole = 'admin' | 'manufacturer' | 'manager' | 'distributor' | 'employee' | 'client';

interface Employee {
  id: number;
  employee_name: string;
  address: string;
  mobile_country_code: string;
  mobile_number: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  email: string;
  employee_type: string;
  manager_name?: string;
  category?: string;
  created_at: string;
}

interface Manager {
  user_id: number;
  full_name: string;
}

const formSchema = z.object({
  employee_name: z.string().min(1, "Employee name is required"),
  address: z.string().min(1, "Address is required"),
  mobile_country_code: z.string().default("+91"),
  mobile_number: z.string().length(10, "Mobile number must be 10 digits"),
  use_mobile_for_whatsapp: z.boolean().default(false),
  whatsapp_country_code: z.string().default("+91"),
  whatsapp_number: z.string().length(10, "WhatsApp number must be 10 digits"),
  email: z.string().email("Please enter a valid email"),
  employee_type: z.string().min(1, "Employee type is required"),
  manager_name: z.string().optional(),
  category: z.string().default("General"),
});

type FormValues = z.infer<typeof formSchema>;

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('employee');

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employee_name: "",
      address: "",
      mobile_country_code: "+91",
      mobile_number: "",
      use_mobile_for_whatsapp: false,
      whatsapp_country_code: "+91",
      whatsapp_number: "",
      email: "",
      employee_type: "Distributor",
      manager_name: "",
      category: "General",
    },
  });

  // Get token and user role on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user role from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }

    // Initial data load
    fetchEmployees();
    fetchManagers();
  }, [navigate]);

  // Fetch employees when page, search, or filter changes
  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchQuery, selectedCategory]);

  // Watch for changes to the use_mobile_for_whatsapp field
  const useMobileForWhatsapp = form.watch('use_mobile_for_whatsapp');
  const mobileNumber = form.watch('mobile_number');
  const mobileCountryCode = form.watch('mobile_country_code');

  // Update WhatsApp number when checkbox is toggled
  useEffect(() => {
    if (useMobileForWhatsapp && mobileNumber) {
      form.setValue('whatsapp_number', mobileNumber);
      form.setValue('whatsapp_country_code', mobileCountryCode);
    }
  }, [useMobileForWhatsapp, mobileNumber, mobileCountryCode, form]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Build query string with filters
      let queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      if (selectedCategory) {
        queryParams.append('category', selectedCategory);
      }

      const response = await fetch(`${API_URL}/api/employees?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data.employees);
      setTotalPages(data.totalPages);
      setCategories(data.categories || []);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/employees/managers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      setManagers(data.managers);
      
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load managers');
    }
  };

  const handleAddEmployee = () => {
    form.reset();
    setCurrentEmployee(null);
    setIsEditMode(false);
    setDialogOpen(true);
  };

  const handleEditEmployee = async (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsEditMode(true);

    // Populate form with employee data
    form.reset({
      employee_name: employee.employee_name,
      address: employee.address,
      mobile_country_code: employee.mobile_country_code || "+91",
      mobile_number: employee.mobile_number,
      use_mobile_for_whatsapp: employee.mobile_number === employee.whatsapp_number,
      whatsapp_country_code: employee.whatsapp_country_code || "+91",
      whatsapp_number: employee.whatsapp_number,
      email: employee.email,
      employee_type: employee.employee_type,
      manager_name: employee.manager_name || "",
      category: employee.category || "General",
    });

    setDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentEmployee) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/employees/${currentEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      toast.success('Employee deleted successfully');
      setDeleteDialogOpen(false);
      fetchEmployees();
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const endpoint = isEditMode && currentEmployee 
        ? `${API_URL}/api/employees/${currentEmployee.id}`
        : `${API_URL}/api/employees`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }

      toast.success(isEditMode ? 'Employee updated successfully' : 'Employee added successfully');
      setDialogOpen(false);
      fetchEmployees();
      
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save employee');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to check if user can add employees
  const canAddEmployee = () => {
    return userRole === 'admin' || userRole === 'manager' || userRole === 'distributor';
  };

  // Function to check if user can edit employees
  const canEditEmployee = (employee: Employee) => {
    if (userRole === 'admin' || userRole === 'distributor') {
      return true;
    }
    
    if (userRole === 'manager' && employee.manager_name === JSON.parse(localStorage.getItem('user') || '{}').fullName) {
      return true;
    }
    
    if (userRole === 'employee' && employee.email === JSON.parse(localStorage.getItem('user') || '{}').email) {
      return true;
    }
    
    return false;
  };

  // Function to check if user can delete employees
  const canDeleteEmployee = (employee: Employee) => {
    if (userRole === 'admin' || userRole === 'distributor') {
      return true;
    }
    
    if (userRole === 'manager' && employee.manager_name === JSON.parse(localStorage.getItem('user') || '{}').fullName) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Employee Management</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search employees..."
                className="pl-8 w-64"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={handleCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>{selectedCategory || "All Categories"}</span>
                </div>
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

            {canAddEmployee() && (
              <Button onClick={handleAddEmployee}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <p>Loading...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium">No employees found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || selectedCategory
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first employee to get started"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">ID</TableHead>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Mobile Number</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.id}</TableCell>
                        <TableCell>{employee.employee_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={employee.address}>
                          {employee.address}
                        </TableCell>
                        <TableCell>
                          {employee.mobile_country_code}{employee.mobile_number}
                        </TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.employee_type}</TableCell>
                        <TableCell>
                          {employee.whatsapp_country_code}{employee.whatsapp_number}
                        </TableCell>
                        <TableCell>{employee.manager_name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {canEditEmployee(employee) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteEmployee(employee) && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteEmployee(employee)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Mobile Number *</FormLabel>
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="mobile_country_code"
                      render={({ field }) => (
                        <FormItem className="w-20">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="mobile_number"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="10 digit number" 
                              maxLength={10}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="use_mobile_for_whatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Use same number for WhatsApp
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              {!useMobileForWhatsapp && (
                <div>
                  <FormLabel>WhatsApp Number *</FormLabel>
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="whatsapp_country_code"
                      render={({ field }) => (
                        <FormItem className="w-20">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="whatsapp_number"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              placeholder="10 digit number" 
                              maxLength={10}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select employee type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Distributor">Distributor</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sales, Support" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Manager field - only show if user role allows it and employee type isn't Manager */}
              {(userRole === 'admin' || userRole === 'distributor') && 
                form.watch('employee_type') !== 'Manager' && (
                <FormField
                  control={form.control}
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Manager</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {managers.map(manager => (
                            <SelectItem key={manager.user_id} value={manager.full_name}>
                              {manager.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? 'Update Employee' : 'Add Employee'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete employee: {currentEmployee?.employee_name}?</p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
