import { useState } from 'react';
import { User, Mail, Lock, LogIn, UserPlus, X } from 'lucide-react';
import AvatarSelector, { getRandomAvatar } from './AvatarSelector';

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSignup: (email: string, password: string, name: string, avatarUrl?: string) => Promise<boolean>;
  onPasswordReset: (email: string) => Promise<boolean>;
  onClose?: () => void;
}

export default function AuthForm({ onLogin, onSignup, onPasswordReset, onClose }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(getRandomAvatar());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    // Simplified - no special requirements
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Don't set loading if already loading (prevent double submission)
    if (isLoading) return;
    
    setIsLoading(true);

    try {
      // Password Reset Mode
      if (mode === 'reset') {
        if (!email.trim()) {
          setError('Email is required');
          setIsLoading(false);
          return;
        }
        
        const success = await onPasswordReset(email);
        setIsLoading(false);
        
        if (success) {
          setSuccess('Password reset instructions sent to your email');
        } else {
          setError('Email not found');
        }
        return;
      }
      
      // Login Mode
      if (mode === 'login') {
        try {
          // Add a timeout to prevent infinite loading
          const loginPromise = onLogin(email, password);
          const timeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 10000)
          );
          
          const success = await Promise.race([loginPromise, timeoutPromise]);
          setIsLoading(false);
          
          if (success) {
            if (onClose) {
              onClose(); // Remove setTimeout, close immediately
            }
          } else {
            setError('Invalid email or password.');
          }
        } catch (error) {
          console.error('[AuthForm] Login error:', error);
          setIsLoading(false);
          setError('Login failed. Please check your connection and try again.');
        }
        return;
      }
      
      // Signup Mode
      if (mode === 'signup') {
        // Validate inputs
        if (!name.trim()) {
          setError('Name is required');
          setIsLoading(false);
          return;
        }
        
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          setIsLoading(false);
          return;
        }
        
        try {
          // Create account with timeout
          const signupPromise = onSignup(email, password, name, avatarUrl);
          const timeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Signup timeout')), 10000)
          );
          
          const signupSuccess = await Promise.race([signupPromise, timeoutPromise]);
          
          if (!signupSuccess) {
            setError('Email already exists or signup failed.');
            setIsLoading(false);
            return;
          }
          
          // Auto-login after successful signup
          setSuccess('Account created! Logging you in...');
          
          const loginPromise = onLogin(email, password);
          const loginTimeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 10000)
          );
          
          const loginSuccess = await Promise.race([loginPromise, loginTimeoutPromise]);
          setIsLoading(false);
          
          if (loginSuccess && onClose) {
            onClose(); // Close immediately
          } else {
            setMode('login');
            setSuccess('Account created! Please log in.');
          }
        } catch (error) {
          console.error('[AuthForm] Signup/Login error:', error);
          setIsLoading(false);
          setError('Operation timed out. Please try again.');
        }
      }
    } catch (err) {
      console.error('[AuthForm] Error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    if (mode === 'reset') {
      setMode('login');
    } else {
      setMode(mode === 'login' ? 'signup' : 'login');
    }
    setError('');
    setSuccess('');
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back!' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" method="POST" action="javascript:void(0)" autoComplete="on">
          {mode === 'signup' && (
            <>
              <div className="flex items-center gap-4">
                <AvatarSelector 
                  selectedAvatar={avatarUrl}
                  onSelectAvatar={setAvatarUrl}
                  size="large"
                />
                <div className="flex-1">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                      autoComplete="name"
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </div>
              {mode === 'signup' && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Password must be at least 6 characters</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              'Loading...'
            ) : (
              <>
                {mode === 'login' ? <LogIn className="h-5 w-5" /> : mode === 'signup' ? <UserPlus className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'reset' ? (
            <p className="text-sm text-gray-600">
              Remember your password?
              <button
                onClick={switchMode}
                className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
              >
                Sign in
              </button>
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={switchMode}
                  className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
              {mode === 'login' && (
                <p className="text-sm text-gray-600">
                  Forgot your password?
                  <button
                    onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                    className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Reset it
                  </button>
                </p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}