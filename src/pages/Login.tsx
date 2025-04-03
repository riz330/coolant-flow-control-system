
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-coolant-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-coolant-700">Coolant Management System</h1>
          <p className="text-coolant-500 mt-2">Log in to access your dashboard</p>
        </div>
        
        <Card className="border-coolant-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-coolant-200 focus:border-coolant-400"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-coolant-200 focus:border-coolant-400 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-coolant-400 hover:bg-coolant-500"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center w-full">
              <Link 
                to="/forgot-password" 
                className="text-sm text-coolant-500 hover:text-coolant-700"
              >
                Forgot password?
              </Link>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              Demo accounts:<br/>
              Try using <span className="font-medium">admin@example.com</span>, <span className="font-medium">manager@example.com</span>,<br/> <span className="font-medium">distributor@example.com</span>, <span className="font-medium">employee@example.com</span>,<br/> <span className="font-medium">client@example.com</span> or <span className="font-medium">manufacturer@example.com</span><br/>
              with password: <span className="font-medium">password123</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
