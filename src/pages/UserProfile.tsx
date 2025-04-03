
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { Check, Eye, EyeOff, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fullName: user?.fullName || '',
    designation: user?.designation || '',
    phoneNumber: '',
    email: user?.email || '',
    company: user?.companyName || '',
    profileImage: user?.profileImage || '/placeholder.svg'
  });
  const [previewImage, setPreviewImage] = useState(user?.profileImage || '/placeholder.svg');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Handle edit profile
  const handleEditProfile = () => {
    setIsEditMode(true);
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setUserProfile({
      fullName: user?.fullName || '',
      designation: user?.designation || '',
      phoneNumber: '',
      email: user?.email || '',
      company: user?.companyName || '',
      profileImage: user?.profileImage || '/placeholder.svg'
    });
    setPreviewImage(user?.profileImage || '/placeholder.svg');
  };
  
  // Handle save profile
  const handleSaveProfile = () => {
    // In a real app, this would make an API call to update the user profile
    toast.success('Profile updated successfully!', {
      duration: 3000,
    });
    setIsEditMode(false);
  };
  
  // Handle profile image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image/(jpeg|jpg|png)')) {
      toast.error('File type not allowed. Please upload a JPG or PNG image.', {
        duration: 5000,
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.', {
        duration: 5000,
      });
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
      setUserProfile({...userProfile, profileImage: reader.result as string});
    };
    reader.readAsDataURL(file);
  };
  
  // Handle password update
  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.', {
        duration: 5000,
      });
      return;
    }
    
    if (getPasswordStrength(newPassword) < 50) {
      toast.error('New password is too weak.', {
        duration: 5000,
      });
      return;
    }
    
    // In a real app, this would make an API call to update the password
    toast.success('Password updated successfully!', {
      duration: 3000,
    });
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  // Calculate password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Contains number
    if (/\d/.test(password)) strength += 25;
    
    // Contains lowercase letter
    if (/[a-z]/.test(password)) strength += 25;
    
    // Contains uppercase letter or special char
    if (/[A-Z]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25;
    
    return strength;
  };
  
  const passwordStrength = getPasswordStrength(newPassword);
  
  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Medium';
    return 'Strong';
  };
  
  const passwordRequirements = [
    { text: 'At least 8 characters', met: newPassword.length >= 8 },
    { text: 'Contains a number', met: /\d/.test(newPassword) },
    { text: 'Contains a letter', met: /[a-zA-Z]/.test(newPassword) },
    { text: 'Contains a special character', met: /[^a-zA-Z0-9]/.test(newPassword) }
  ];
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-coolant-800 mb-6">User Profile</h1>
        
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General Profile</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardContent className="p-6">
                {!isEditMode ? (
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-coolant-100 border-4 border-coolant-200">
                        <img 
                          src={previewImage} 
                          alt={`${user?.fullName}'s profile`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-grow space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                          <p className="text-lg font-medium">{user?.fullName}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Designation</h3>
                          <p className="text-lg">{user?.designation || '-'}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="text-lg">{user?.email}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Role</h3>
                          <p className="text-lg capitalize">{user?.role}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                          <p className="text-lg">{userProfile.phoneNumber || '-'}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-500">Company</h3>
                          <p className="text-lg">{user?.companyName || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          onClick={handleEditProfile}
                          className="bg-coolant-400 hover:bg-coolant-500"
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-shrink-0">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden bg-coolant-100 border-4 border-coolant-200">
                          <img 
                            src={previewImage} 
                            alt="Profile preview" 
                            className="w-full h-full object-cover"
                          />
                          
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <label 
                              htmlFor="profile-image-upload"
                              className="cursor-pointer bg-white rounded-full p-2"
                            >
                              <Upload className="h-5 w-5 text-coolant-600" />
                              <input
                                id="profile-image-upload"
                                type="file"
                                accept="image/jpeg,image/png"
                                onChange={handleImageChange}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Click to change image
                        </p>
                      </div>
                      
                      <div className="flex-grow space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input 
                              id="full-name" 
                              value={userProfile.fullName}
                              onChange={(e) => setUserProfile({...userProfile, fullName: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input 
                              id="designation" 
                              value={userProfile.designation}
                              onChange={(e) => setUserProfile({...userProfile, designation: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email"
                              value={userProfile.email}
                              onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone" 
                              type="tel"
                              value={userProfile.phoneNumber}
                              onChange={(e) => setUserProfile({...userProfile, phoneNumber: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="company">Company</Label>
                            <Input 
                              id="company" 
                              value={userProfile.company}
                              onChange={(e) => setUserProfile({...userProfile, company: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      
                      <Button 
                        onClick={handleSaveProfile}
                        className="bg-coolant-400 hover:bg-coolant-500"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardContent className="p-6">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter your current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {newPassword && (
                      <div className="mt-2 space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-coolant-600">Password strength</span>
                            <span className={`font-medium ${
                              passwordStrength < 50 ? 'text-red-500' : 
                              passwordStrength < 75 ? 'text-yellow-500' : 
                              'text-green-500'
                            }`}>
                              {getStrengthText(passwordStrength)}
                            </span>
                          </div>
                          <Progress 
                            value={passwordStrength} 
                            className="h-1 w-full bg-gray-200" 
                          />
                        </div>
                        
                        <ul className="space-y-1">
                          {passwordRequirements.map((req, i) => (
                            <li key={i} className="flex items-center text-xs">
                              {req.met ? (
                                <Check className="h-3 w-3 mr-2 text-green-500" />
                              ) : (
                                <X className="h-3 w-3 mr-2 text-red-500" />
                              )}
                              <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                                {req.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {newPassword && confirmPassword && (
                      <div className="mt-1 flex items-center text-xs">
                        {newPassword === confirmPassword ? (
                          <>
                            <Check className="h-3 w-3 mr-2 text-green-500" />
                            <span className="text-green-600">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-2 text-red-500" />
                            <span className="text-red-500">Passwords don't match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleUpdatePassword}
                    className="w-full bg-coolant-400 hover:bg-coolant-500"
                    disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || passwordStrength < 50}
                  >
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
