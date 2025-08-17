import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, signup, resetPassword } = useAuth();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLoginSuccess = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    }
    return success;
  };

  const handleSignupSuccess = async (email: string, password: string, name: string, avatarUrl?: string) => {
    const success = await signup(email, password, name, avatarUrl);
    if (success) {
      // Auto-login after signup
      const loginSuccess = await login(email, password);
      if (loginSuccess) {
        navigate('/dashboard');
      }
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <AuthForm 
        onLogin={handleLoginSuccess}
        onSignup={handleSignupSuccess}
        onPasswordReset={resetPassword}
        // Don't provide onClose - we handle navigation in the success handlers
      />
    </div>
  );
}