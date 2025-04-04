
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Edit, Upload, X, Check } from 'lucide-react';

interface UserProfileData {
  full_name: string;
  designation: string;
  phone_number: string;
  user_mailid: string;
  company: string;
  profile_image: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserProfileData | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const API_BASE_URL = 'http://localhost:5000/api';
  
  useEffect(() => {
    fetchUserProfile();
  }, [user]);
  
  useEffect(() => {
    if (newPassword) {
      calculatePasswordStrength(newPassword);
    } else {
      setPasswordStrength(0);
    }
  }, [newPassword]);
  
  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setProfileData(data);
      setFormData(data);
      setPreviewImage(data.profile_image ? `${API_BASE_URL}${data.profile_image}` : null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit mode
      setFormData(profileData);
      setPreviewImage(profileData?.profile_image ? `${API_BASE_URL}${profileData.profile_image}` : null);
      setProfileImage(null);
    }
    setEditMode(!editMode);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image/(jpeg|jpg|png)')) {
      toast.error('Please upload a JPG or PNG image.');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should not exceed 2MB.');
      return;
    }
    
    setProfileImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setPreviewImage(null);
    setProfileImage(null);
    
    if (formData) {
      setFormData({
        ...formData,
        profile_image: null
      });
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const formDataObj = new FormData();
      formDataObj.append('full_name', formData.full_name);
      formDataObj.append('designation', formData.designation || '');
      formDataObj.append('phone_number', formData.phone_number || '');
      formDataObj.append('user_mailid', formData.user_mailid);
      formDataObj.append('company', formData.company || '');
      
      if (profileImage) {
        formDataObj.append('profile_image', profileImage);
      }
      
      const response = await fetch(`${API_BASE_URL}/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      setProfileData(data);
      setEditMode(false);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };
  
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains uppercase or special char
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  };
  
  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordStrength < 75) {
      toast.error('Please use a stronger password');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
      
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to change password');
      }
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coolant-500 mx-auto"></div>
            <p className="mt-4 text-coolant-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="password">Security & Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>
                  View and manage your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center justify-start gap-4">
                    <div className="relative">
                      <Avatar className="h-40 w-40">
                        <AvatarImage src={previewImage || '/placeholder.svg'} />
                        <AvatarFallback>{profileData?.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      
                      {editMode && (
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                          <div className="relative">
                            <Button 
                              variant="default" 
                              size="icon" 
                              className="rounded-full bg-coolant-500 hover:bg-coolant-600"
                            >
                              <Upload className="h-4 w-4" />
                              <input 
                                type="file" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                onChange={handleImageChange}
                                accept="image/jpeg, image/png"
                              />
                            </Button>
                          </div>
                          
                          {previewImage && (
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="rounded-full"
                              onClick={handleRemoveImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-medium">{profileData?.full_name}</p>
                      <p className="text-coolant-600 text-sm">{profileData?.role}</p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    {editMode ? (
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input 
                              id="full_name" 
                              name="full_name" 
                              value={formData?.full_name || ''} 
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input 
                              id="designation" 
                              name="designation" 
                              value={formData?.designation || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="user_mailid">Email</Label>
                            <Input 
                              id="user_mailid" 
                              name="user_mailid" 
                              type="email" 
                              value={formData?.user_mailid || ''} 
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone_number">Phone Number</Label>
                            <Input 
                              id="phone_number" 
                              name="phone_number" 
                              value={formData?.phone_number || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="company">Company</Label>
                            <Input 
                              id="company" 
                              name="company" 
                              value={formData?.company || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" type="button" onClick={handleEditToggle}>
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-coolant-500 hover:bg-coolant-600">
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-coolant-600">Full Name</p>
                            <p className="font-medium">{profileData?.full_name}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-coolant-600">Designation</p>
                            <p className="font-medium">{profileData?.designation || '-'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-coolant-600">Email</p>
                            <p className="font-medium">{profileData?.user_mailid}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-coolant-600">Phone Number</p>
                            <p className="font-medium">{profileData?.phone_number || '-'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-coolant-600">Company</p>
                            <p className="font-medium">{profileData?.company || '-'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-coolant-600">Role</p>
                            <p className="font-medium capitalize">{profileData?.role}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-4">
                          <Button onClick={handleEditToggle} className="bg-coolant-500 hover:bg-coolant-600">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password. For security, you'll need to enter your current password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1 text-xs">
                          <span>Strength:</span>
                          <span>
                            {passwordStrength < 50 ? 'Weak' : 
                             passwordStrength < 75 ? 'Medium' : 'Strong'}
                          </span>
                        </div>
                        <Progress value={passwordStrength} className={getStrengthColor()} />
                        <p className="text-xs text-gray-500 mt-1">
                          Password should be at least 8 characters with 1 number and 1 special character.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                  
                  <Button type="submit" className="bg-coolant-500 hover:bg-coolant-600 mt-4">
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
