import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await register(email, password, fullName);

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 50%)'
        }}
      />
      
      <Card className="w-full max-w-md z-10 bg-[#18181B] border-[#27272A]" data-testid="register-card">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-[#FAFAFA] tracking-tight">
            Create Account
          </CardTitle>
          <CardDescription className="text-[#A1A1AA]">
            Get started with Campaign Pulse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[#FAFAFA]">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#3B82F6]"
                data-testid="fullname-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#FAFAFA]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#3B82F6]"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#FAFAFA]">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-[#09090B] border-[#27272A] text-[#FAFAFA] focus:ring-[#3B82F6]"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white"
              disabled={isLoading}
              data-testid="register-submit-button"
              style={{ boxShadow: '0 0 15px rgba(59,130,246,0.4)' }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-[#A1A1AA]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#3B82F6] hover:underline" data-testid="login-link">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
