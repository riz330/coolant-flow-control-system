
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { API_URL } from '@/config';
import { toast } from 'sonner';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  whatsapp_number: string | null;
  profile_picture: string | null;
  role: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    whatsapp_number: '',
  });
  
  // Get token from localStorage instead of auth context
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data);
        setFormValues({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          mobile_number: data.mobile_number || '',
          whatsapp_number: data.whatsapp_number || '',
        });

        if (data.profile_picture) {
          setPreviewUrl(`${API_URL}${data.profile_picture}`);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload JPEG, JPG, or PNG images only');
      return;
    }

    setProfilePicture(file);

    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append('first_name', formValues.first_name);
      formData.append('last_name', formValues.last_name);
      formData.append('mobile_number', formValues.mobile_number);
      
      if (formValues.whatsapp_number) {
        formData.append('whatsapp_number', formValues.whatsapp_number);
      }
      
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }
      
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      
      // Update the profile state
      setProfile(updatedProfile);
      
      // Instead of using updateUser from context, update the user object manually if needed
      if (user) {
        // Handle user update in another way if needed, or just show a toast
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      let errorMessage = 'Failed to update profile';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex justify-center items-center h-64">
            <div>Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-2xl">User Profile</CardTitle>
          <CardDescription>
            Update your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-4xl">
                      {profile?.first_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="profilePicture" className="cursor-pointer inline-block px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                  Change Picture
                </Label>
                <Input 
                  id="profilePicture" 
                  type="file" 
                  onChange={handleProfilePictureChange} 
                  className="hidden" 
                  accept="image/png,image/jpeg,image/jpg"
                />
              </div>
              
              <div className="text-sm text-gray-500">
                Maximum file size: 2MB<br />
                Supported formats: JPG, JPEG, PNG
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={profile?.username || ''} 
                  readOnly 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={profile?.email || ''} 
                  readOnly 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input 
                  id="first_name" 
                  name="first_name" 
                  value={formValues.first_name} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input 
                  id="last_name" 
                  name="last_name" 
                  value={formValues.last_name} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input 
                  id="mobile_number" 
                  name="mobile_number" 
                  value={formValues.mobile_number} 
                  onChange={handleInputChange}
                  placeholder="+91 9012345678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input 
                  id="whatsapp_number" 
                  name="whatsapp_number" 
                  value={formValues.whatsapp_number} 
                  onChange={handleInputChange}
                  placeholder="+91 9012345678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  value={profile?.role || ''} 
                  readOnly 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
