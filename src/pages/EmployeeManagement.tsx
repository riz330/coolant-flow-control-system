
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

// Define employee schema
const employeeSchema = z.object({
  employee_name: z.string().min(1, 'Employee name is required'),
  address: z.string().min(1, 'Address is required'),
  mobile_country_code: z.string().default('+91'),
  mobile_number: z.string().length(10, 'Mobile number must be 10 digits'),
  use_same_for_whatsapp: z.boolean().default(false),
  whatsapp_country_code: z.string().default('+91'),
  whatsapp_number: z.string().length(10, 'WhatsApp number must be 10 digits'),
  email: z.string().email('Invalid email address'),
  employee_type: z.string().min(1, 'Employee type is required'),
  manager_name: z.string().optional(),
  category: z.string().default('General'),
});

type EmployeeData = z.infer<typeof employeeSchema>;

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
  manager_name: string | null;
  category: string;
  created_at: string;
}

interface Manager {
  user_id: string;
  full_name: string;
}

const EmployeeManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const pageSize = 10;

  // Get user role from localStorage
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserRole(userData.role);
    }
  }, []);

  // Initialize form with empty values
  const form = useForm<EmployeeData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_name: '',
      address: '',
      mobile_country_code: '+91',
      mobile_number: '',
      use_same_for_whatsapp: false,
      whatsapp_country_code: '+91',
      whatsapp_number: '',
      email: '',
      employee_type: '',
      manager_name: '',
      category: 'General',
    },
  });

  // Watch the use_same_for_whatsapp field to sync mobile and whatsapp numbers
  const useSameForWhatsapp = form.watch('use_same_for_whatsapp');
  const mobileNumber = form.watch('mobile_number');
  const mobileCountryCode = form.watch('mobile_country_code');

  useEffect(() => {
    if (useSameForWhatsapp) {
      form.setValue('whatsapp_number', mobileNumber);
      form.setValue('whatsapp_country_code', mobileCountryCode);
    }
  }, [useSameForWhatsapp, mobileNumber, mobileCountryCode, form]);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Fetch employees
  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const queryParams = new URLSearchParams();
    queryParams.append('page', currentPage.toString());
    queryParams.append('limit', pageSize.toString());
    
    if (searchTerm) {
      queryParams.append('search', searchTerm);
    }

    if (selectedCategory) {
      queryParams.append('category', selectedCategory);
    }

    const response = await fetch(`${API_BASE_URL}/employees?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }

    return response.json();
  };

  // Fetch managers for dropdown
  const fetchManagers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/employees/managers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch managers');
    }

    return response.json();
  };

  // Use React Query for data fetching
  const {
    data: employeesData,
    isLoading: isLoadingEmployees,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employees', currentPage, searchTerm, selectedCategory],
    queryFn: fetchEmployees,
  });

  const {
    data: managersData,
    isLoading: isLoadingManagers,
  } = useQuery({
    queryKey: ['managers'],
    queryFn: fetchManagers,
  });

  useEffect(() => {
    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      toast.error('Failed to load employees. Please try again.');
    }
  }, [employeesError]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetchEmployees();
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    refetchEmployees();
  };

  // Reset form for add employee
  const handleAddEmployeeClick = () => {
    form.reset({
      employee_name: '',
      address: '',
      mobile_country_code: '+91',
      mobile_number: '',
      use_same_for_whatsapp: false,
      whatsapp_country_code: '+91',
      whatsapp_number: '',
      email: '',
      employee_type: '',
      manager_name: '',
      category: 'General',
    });
    setIsAddDialogOpen(true);
  };

  // Populate form for edit employee
  const handleEditEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.reset({
      employee_name: employee.employee_name,
      address: employee.address,
      mobile_country_code: employee.mobile_country_code,
      mobile_number: employee.mobile_number,
      use_same_for_whatsapp: employee.mobile_number === employee.whatsapp_number,
      whatsapp_country_code: employee.whatsapp_country_code,
      whatsapp_number: employee.whatsapp_number,
      email: employee.email,
      employee_type: employee.employee_type,
      manager_name: employee.manager_name || '',
      category: employee.category,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  // Add new employee
  const addEmployee = async (data: EmployeeData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add employee');
      }

      toast.success('Employee added successfully');
      setIsAddDialogOpen(false);
      refetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add employee');
    }
  };

  // Update employee
  const updateEmployee = async (data: EmployeeData) => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update employee');
      }

      toast.success('Employee updated successfully');
      setIsEditDialogOpen(false);
      refetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update employee');
    }
  };

  // Delete employee
  const deleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete employee');
      }

      toast.success('Employee deleted successfully');
      setIsDeleteDialogOpen(false);
      refetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete employee');
    }
  };

  const onSubmit = (data: EmployeeData) => {
    // If useSameForWhatsapp is true, use mobile number for WhatsApp
    if (data.use_same_for_whatsapp) {
      data.whatsapp_number = data.mobile_number;
      data.whatsapp_country_code = data.mobile_country_code;
    }

    // Remove the use_same_for_whatsapp field as it's not needed in the API
    const { use_same_for_whatsapp, ...apiData } = data;

    if (isEditDialogOpen) {
      updateEmployee(apiData);
    } else {
      addEmployee(apiData);
    }
  };

  // Generate pagination links
  const renderPagination = () => {
    if (!employeesData) return null;

    const totalPages = employeesData.totalPages || 1;
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Employee Management</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Employees</CardTitle>
          <div className="flex space-x-2">
            <form onSubmit={handleSearch} className="relative">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </form>

            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {employeesData?.categories?.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {userRole !== 'employee' && (
              <Button onClick={handleAddEmployeeClick}>
                <Plus className="mr-1 h-4 w-4" /> Add Employee
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-coolant-500"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeesData?.employees?.length ? (
                      employeesData.employees.map((employee: Employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.id}</TableCell>
                          <TableCell>{employee.employee_name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>{`${employee.mobile_country_code} ${employee.mobile_number}`}</TableCell>
                          <TableCell>{employee.employee_type}</TableCell>
                          <TableCell>{employee.category}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditEmployeeClick(employee)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {userRole !== 'employee' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => handleDeleteEmployeeClick(employee)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No employees found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-center">{renderPagination()}</div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="mobile_country_code"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Code*</FormLabel>
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
                        <FormLabel>Mobile Number*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="use_same_for_whatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Use as WhatsApp Communication Number</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {!useSameForWhatsapp && (
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="whatsapp_country_code"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Code*</FormLabel>
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
                          <FormLabel>WhatsApp Number*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="employee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
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
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingManagers ? (
                            <SelectItem value="loading">Loading managers...</SelectItem>
                          ) : (
                            managersData?.managers?.map((manager: Manager) => (
                              <SelectItem key={manager.user_id} value={manager.full_name}>
                                {manager.full_name}
                              </SelectItem>
                            ))
                          )}
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
                        <Input {...field} placeholder="General" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Employee</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="mobile_country_code"
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormLabel>Code*</FormLabel>
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
                        <FormLabel>Mobile Number*</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="use_same_for_whatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Use as WhatsApp Communication Number</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {!useSameForWhatsapp && (
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="whatsapp_country_code"
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormLabel>Code*</FormLabel>
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
                          <FormLabel>WhatsApp Number*</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="employee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Type*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={userRole === 'employee'}
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
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager Name</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={userRole === 'employee'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingManagers ? (
                            <SelectItem value="loading">Loading managers...</SelectItem>
                          ) : (
                            managersData?.managers?.map((manager: Manager) => (
                              <SelectItem key={manager.user_id} value={manager.full_name}>
                                {manager.full_name}
                              </SelectItem>
                            ))
                          )}
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
                        <Input {...field} placeholder="General" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Employee</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              record for <span className="font-semibold">{selectedEmployee?.employee_name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEmployee} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeeManagement;
