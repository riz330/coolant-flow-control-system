
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "@/components/ui/use-toast";
import { 
  Edit, Trash, Search, Plus, Filter, ArrowLeft, ArrowRight 
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import fetchWithAuth from "@/utils/auth-fetch";
import { use } from "@tanstack/react-query";

// Define the Employee interface
interface Employee {
  id: number;
  employee_name: string;
  address: string;
  mobile_number: string;
  mobile_country_code: string;
  whatsapp_number: string;
  whatsapp_country_code: string;
  email: string;
  employee_type: string;
  manager_name: string | null;
}

// Define Pagination interface
interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// Main component
const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // States for employee data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  
  // States for filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [employeeTypes, setEmployeeTypes] = useState<string[]>([]);
  const [managers, setManagers] = useState<string[]>([]);

  // States for form dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // State for selected employee to edit or delete
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<Employee>>({
    employee_name: "",
    address: "",
    mobile_number: "",
    mobile_country_code: "+91",
    whatsapp_number: "",
    whatsapp_country_code: "+91",
    email: "",
    employee_type: "",
    manager_name: null
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch employees with pagination, search, and filters
  const fetchEmployees = async (page = 1, search = searchQuery, employeeType = selectedType) => {
    setIsLoading(true);
    try {
      let url = `${import.meta.env.VITE_API_URL}/employees?page=${page}&limit=${pagination.limit}`;
      
      if (search) {
        url += `&search=${search}`;
      }
      
      if (employeeType) {
        url += `&employee_type=${employeeType}`;
      }
      
      const response = await fetchWithAuth(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      const data = await response.json();
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch employee types for filtering
  const fetchEmployeeTypes = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/employees/types`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch employee types");
      }
      
      const data = await response.json();
      setEmployeeTypes(data.types);
    } catch (error) {
      console.error("Error fetching employee types:", error);
    }
  };
  
  // Fetch managers for the form dropdown
  const fetchManagers = async () => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/employees/managers`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch managers");
      }
      
      const data = await response.json();
      setManagers(data.managers);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };
  
  // Initial data loading
  useEffect(() => {
    fetchEmployees();
    fetchEmployeeTypes();
    fetchManagers();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.employee_name?.trim()) {
      errors.employee_name = "Employee name is required";
    }
    
    if (!formData.address?.trim()) {
      errors.address = "Address is required";
    }
    
    if (!formData.mobile_number?.trim()) {
      errors.mobile_number = "Mobile number is required";
    } else if (formData.mobile_number.length !== 10) {
      errors.mobile_number = "Mobile number must be 10 digits";
    }
    
    if (!formData.whatsapp_number?.trim()) {
      errors.whatsapp_number = "WhatsApp number is required";
    } else if (formData.whatsapp_number.length !== 10) {
      errors.whatsapp_number = "WhatsApp number must be 10 digits";
    }
    
    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.employee_type) {
      errors.employee_type = "Employee type is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle search
  const handleSearch = () => {
    fetchEmployees(1, searchQuery, selectedType);
  };
  
  // Handle filter change
  const handleFilterChange = (type: string) => {
    setSelectedType(type);
    fetchEmployees(1, searchQuery, type);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      fetchEmployees(newPage, searchQuery, selectedType);
    }
  };
  
  // Handle add employee form submission
  const handleAddEmployee = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/employees`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add employee");
      }
      
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      
      setIsAddDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit employee
  const handleEditEmployee = async () => {
    if (!validateForm() || !selectedEmployee) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/employees/${selectedEmployee.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update employee");
      }
      
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delete employee
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/employees/${selectedEmployee.id}`,
        {
          method: "DELETE",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete employee");
      }
      
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      employee_name: "",
      address: "",
      mobile_number: "",
      mobile_country_code: "+91",
      whatsapp_number: "",
      whatsapp_country_code: "+91",
      email: "",
      employee_type: "",
      manager_name: null
    });
    setFormErrors({});
  };
  
  // Open edit dialog and populate form
  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      employee_name: employee.employee_name,
      address: employee.address,
      mobile_number: employee.mobile_number,
      mobile_country_code: employee.mobile_country_code,
      whatsapp_number: employee.whatsapp_number,
      whatsapp_country_code: employee.whatsapp_country_code,
      email: employee.email,
      employee_type: employee.employee_type,
      manager_name: employee.manager_name
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Employee Management</h1>
        </div>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="flex w-full max-w-md items-center space-x-2">
                  <Input
                    id="search"
                    placeholder="Search by name, email, or mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} type="button">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <Label htmlFor="filter">Filter by Type</Label>
                  <Select onValueChange={handleFilterChange} value={selectedType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {employeeTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="self-end">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        resetForm();
                        setIsAddDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>
                          Enter the employee details below to create a new record.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="employee_name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="employee_name"
                            name="employee_name"
                            className="col-span-3"
                            value={formData.employee_name || ''}
                            onChange={handleInputChange}
                          />
                          {formErrors.employee_name && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.employee_name}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="address" className="text-right">
                            Address
                          </Label>
                          <Input
                            id="address"
                            name="address"
                            className="col-span-3"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                          />
                          {formErrors.address && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.address}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="mobile_number" className="text-right">
                            Mobile
                          </Label>
                          <div className="col-span-3 flex gap-2">
                            <Input
                              id="mobile_country_code"
                              name="mobile_country_code"
                              className="w-20"
                              value={formData.mobile_country_code || '+91'}
                              onChange={handleInputChange}
                            />
                            <Input
                              id="mobile_number"
                              name="mobile_number"
                              className="flex-1"
                              value={formData.mobile_number || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          {formErrors.mobile_number && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.mobile_number}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="whatsapp_number" className="text-right">
                            WhatsApp
                          </Label>
                          <div className="col-span-3 flex gap-2">
                            <Input
                              id="whatsapp_country_code"
                              name="whatsapp_country_code"
                              className="w-20"
                              value={formData.whatsapp_country_code || '+91'}
                              onChange={handleInputChange}
                            />
                            <Input
                              id="whatsapp_number"
                              name="whatsapp_number"
                              className="flex-1"
                              value={formData.whatsapp_number || ''}
                              onChange={handleInputChange}
                            />
                          </div>
                          {formErrors.whatsapp_number && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.whatsapp_number}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            className="col-span-3"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                          />
                          {formErrors.email && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.email}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="employee_type" className="text-right">
                            Type
                          </Label>
                          <Select
                            value={formData.employee_type || ''}
                            onValueChange={(value) => handleSelectChange("employee_type", value)}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select employee type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Distributor">Distributor</SelectItem>
                            </SelectContent>
                          </Select>
                          {formErrors.employee_type && (
                            <p className="col-span-4 text-right text-red-500 text-sm">
                              {formErrors.employee_type}
                            </p>
                          )}
                        </div>
                        
                        {formData.employee_type === "Distributor" && (
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="manager_name" className="text-right">
                              Manager
                            </Label>
                            <Select
                              value={formData.manager_name || ''}
                              onValueChange={(value) => handleSelectChange("manager_name", value)}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select manager" />
                              </SelectTrigger>
                              <SelectContent>
                                {managers.map((manager) => (
                                  <SelectItem key={manager} value={manager}>
                                    {manager}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddEmployee} disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Employee"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              Manage your employees and their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.mobile_country_code} {employee.mobile_number}</TableCell>
                      <TableCell>{employee.employee_type}</TableCell>
                      <TableCell>{employee.manager_name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(employee)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              Showing {employees.length} of {pagination.total} employees
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the employee details below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_employee_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit_employee_name"
                  name="employee_name"
                  className="col-span-3"
                  value={formData.employee_name || ''}
                  onChange={handleInputChange}
                />
                {formErrors.employee_name && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.employee_name}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_address" className="text-right">
                  Address
                </Label>
                <Input
                  id="edit_address"
                  name="address"
                  className="col-span-3"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                />
                {formErrors.address && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.address}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_mobile_number" className="text-right">
                  Mobile
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit_mobile_country_code"
                    name="mobile_country_code"
                    className="w-20"
                    value={formData.mobile_country_code || '+91'}
                    onChange={handleInputChange}
                  />
                  <Input
                    id="edit_mobile_number"
                    name="mobile_number"
                    className="flex-1"
                    value={formData.mobile_number || ''}
                    onChange={handleInputChange}
                  />
                </div>
                {formErrors.mobile_number && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.mobile_number}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_whatsapp_number" className="text-right">
                  WhatsApp
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit_whatsapp_country_code"
                    name="whatsapp_country_code"
                    className="w-20"
                    value={formData.whatsapp_country_code || '+91'}
                    onChange={handleInputChange}
                  />
                  <Input
                    id="edit_whatsapp_number"
                    name="whatsapp_number"
                    className="flex-1"
                    value={formData.whatsapp_number || ''}
                    onChange={handleInputChange}
                  />
                </div>
                {formErrors.whatsapp_number && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.whatsapp_number}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit_email"
                  name="email"
                  type="email"
                  className="col-span-3"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                />
                {formErrors.email && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.email}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_employee_type" className="text-right">
                  Type
                </Label>
                <Select
                  value={formData.employee_type || ''}
                  onValueChange={(value) => handleSelectChange("employee_type", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select employee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Distributor">Distributor</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.employee_type && (
                  <p className="col-span-4 text-right text-red-500 text-sm">
                    {formErrors.employee_type}
                  </p>
                )}
              </div>
              
              {formData.employee_type === "Distributor" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit_manager_name" className="text-right">
                    Manager
                  </Label>
                  <Select
                    value={formData.manager_name || ''}
                    onValueChange={(value) => handleSelectChange("manager_name", value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager} value={manager}>
                          {manager}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEmployee} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Employee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                employee record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEmployee} disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default EmployeeManagement;
