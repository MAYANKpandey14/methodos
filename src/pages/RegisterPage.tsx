
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import ThemeToggle from '@/components/ThemeToggle';
import { sanitizeInput, validateEmail } from '@/utils/security';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security: Input validation and sanitization
    const sanitizedEmail = sanitizeInput(email, 254);
    const sanitizedPassword = sanitizeInput(password, 100);
    const sanitizedConfirmPassword = sanitizeInput(confirmPassword, 100);
    const sanitizedFullName = sanitizeInput(fullName, 100);
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
    
    if (sanitizedPassword !== sanitizedConfirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    // Enhanced password validation to match security requirements
    const passwordValidation = {
      isValid: true,
      errors: [] as string[]
    };
    
    if (sanitizedPassword.length < 8) {
      passwordValidation.errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(sanitizedPassword)) {
      passwordValidation.errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(sanitizedPassword)) {
      passwordValidation.errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(sanitizedPassword)) {
      passwordValidation.errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(sanitizedPassword)) {
      passwordValidation.errors.push('Password must contain at least one special character');
    }
    
    passwordValidation.isValid = passwordValidation.errors.length === 0;
    
    if (!passwordValidation.isValid) {
      toast({
        title: 'Password Requirements Not Met',
        description: passwordValidation.errors.join(' '),
        variant: 'destructive',
      });
      return;
    }

    const result = await signUp(sanitizedEmail, sanitizedPassword, sanitizedFullName);
    
    if (result.error) {
      toast({
        title: 'Error',
        description: result.error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } else {
      // Store email for verification page and redirect
      localStorage.setItem('pendingVerificationEmail', sanitizedEmail);
      navigate(`/verify-email?email=${encodeURIComponent(sanitizedEmail)}`);
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md relative">
        <div className="absolute top-0 right-0 -mt-16">
          <ThemeToggle />
        </div>
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Join FocusFlow</CardTitle>
            <CardDescription>
              Create your account to start boosting your productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your password"
                  minLength={8}
                  maxLength={100}
                />
                <PasswordStrength password={password} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Confirm your password"
                  minLength={8}
                  maxLength={100}
                />
                <PasswordStrength password={confirmPassword} className="mt-2" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
