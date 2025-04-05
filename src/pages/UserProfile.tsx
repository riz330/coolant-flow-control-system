import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

interface UserProfileData {
  user_id: number;
  username: string;
  fullname: string;
  email: string;
  designation: string;
  company: string;
  mobile_number: string;
  profile_image: string | null;
  role: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  // Profile edit form state
  const [profileForm, setProfileForm] = useState({
    fullname: "",
    username: "",
    email: "",
    designation: "",
    company: "",
    mobile_number: "",
    profile_image: null as File | null
  });
  
  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Fetch user profile data
  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Use the correct property name (id instead of user_id)
      const response = await fetch(`/api/profile/?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setProfileData(data.user);
      } else {
        toast.error(data.error || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit");
        return;
      }
      
      // Check file type
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        toast.error("Only PNG, JPG, and JPEG images are allowed");
        return;
      }
      
      setProfileForm(prev => ({ ...prev, profile_image: file }));
      
      // Set preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Submit password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // Use the correct property name (id instead of user_id)
          user_id: user.id,
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Password changed successfully");
        setIsChangePasswordOpen(false);
        // Reset form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    }
  };
  
  // Open edit profile modal
  const openEditProfile = () => {
    if (!profileData) return;
    
    setProfileForm({
      fullname: profileData.fullname || "",
      username: profileData.username || "",
      email: profileData.email || "",
      designation: profileData.designation || "",
      company: profileData.company || "",
      mobile_number: profileData.mobile_number || "",
      profile_image: null
    });
    
    setImagePreview(profileData.profile_image || null);
    setIsEditProfileOpen(true);
  };
  
  // Submit profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      // Use FormData to handle file upload
      const formData = new FormData();
      // Use the correct property name (id instead of user_id)
      formData.append("user_id", user.id.toString());
      formData.append("fullname", profileForm.fullname);
      formData.append("username", profileForm.username);
      formData.append("email", profileForm.email);
      formData.append("designation", profileForm.designation);
      formData.append("company", profileForm.company);
      formData.append("mobile_number", profileForm.mobile_number);
      
      if (profileForm.profile_image) {
        formData.append("profile_image", profileForm.profile_image);
      }
      
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Profile updated successfully");
        setIsEditProfileOpen(false);
        setProfileData(data.user);
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Image Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 bg-gray-100 flex items-center justify-center">
              {profileData?.profile_image ? (
                <img
                  src={profileData.profile_image}
                  alt={profileData.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-4xl text-gray-400">
                  {profileData?.fullname.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold">{profileData?.fullname}</h2>
            <p className="text-sm text-gray-600">{profileData?.designation}</p>
            <p className="text-sm text-gray-600 mb-4">{profileData?.role}</p>
            
            <div className="flex flex-col w-full gap-2">
              <Button onClick={openEditProfile} variant="outline" className="w-full">
                Edit Profile
              </Button>
              <Button
                onClick={() => setIsChangePasswordOpen(true)}
                variant="outline"
                className="w-full"
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Your personal and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Account Information</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <p>{profileData?.fullname}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Username</Label>
                  <p>{profileData?.username}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p>{profileData?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Role</Label>
                  <p>{profileData?.role}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Work Information</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Designation</Label>
                  <p>{profileData?.designation || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Company</Label>
                  <p>{profileData?.company || "Not specified"}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Mobile Number</Label>
                  <p>{profileData?.mobile_number || "Not specified"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password below.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Change Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                name="fullname"
                value={profileForm.fullname}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                value={profileForm.designation}
                onChange={handleProfileChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={profileForm.company}
                onChange={handleProfileChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                name="mobile_number"
                value={profileForm.mobile_number}
                onChange={handleProfileChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="profile_image">Profile Image (Max 2MB, PNG/JPG)</Label>
              <Input
                id="profile_image"
                name="profile_image"
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">Image Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    className="w-24 h-24 object-cover rounded-full border border-gray-200"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
