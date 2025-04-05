
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField,

  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define form schema
const profileSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  companyName: z.string().optional(),
  designation: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

const UserProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  
  const API_BASE_URL = 'http://localhost:5000/api';

  // Initialize form with user data
  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      companyName: user?.companyName || '',
      designation: user?.designation || '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        companyName: user.companyName || '',
        designation: user.designation || '',
      });
      setProfileImage(user.profileImage || null);
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileData) => {
    setLoading(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      
      if (data.companyName) {
        formData.append('companyName', data.companyName);
      }
      
      if (data.designation) {
        formData.append('designation', data.designation);
      }
      
      // Add profile image if changed
      if (uploadedImage) {
        formData.append('profileImage', uploadedImage);
      }
      
      // Make API request to update profile
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const updatedData = await response.json();
      
      // Update local storage user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...userData, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Update profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      
      // Create a temporary URL for preview
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Image Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="w-32 h-32 mb-4">
              <AvatarImage src={profileImage || ''} alt={user.fullName} />
              <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="mt-4">
              <input
                type="file"
                id="profile-image"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <label 
                htmlFor="profile-image" 
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
              >
                Change Image
              </label>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
