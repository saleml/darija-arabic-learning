import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SSOCallback from './pages/SSOCallback';
import LanguageSetup from './components/LanguageSetup';
import HybridAuthForm from './components/HybridAuthForm';
import { debugEnvironment } from './utils/debug';
import { useEffect } from 'react';

// Component to handle legacy dashboard routes
function DashboardRedirect() {
  const { tab } = useParams<{ tab: string }>();
  const validTabs = ['hub', 'quiz', 'progress', 'culture'];
  const redirectTab = validTabs.includes(tab || '') ? tab : 'hub';
  return <Navigate to={`/${redirectTab}`} replace />;
}

function App() {
  const { isLoaded, isSignedIn } = useUser();
  const { user, sourceLanguage, targetLanguage, updateProfile, isLoading } = useAuth();
  
  // Debug environment on mount
  useEffect(() => {
    debugEnvironment();
  }, []);

  // Show loading state while Clerk is initializing
  if (!isLoaded || isLoading) {
    console.log('🔄 App Loading State:', {
      isLoaded,
      isLoading,
      isSignedIn,
      hasUser: !!user
    });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">Loading...</div>
          <div className="text-sm text-gray-500">
            {!isLoaded && 'Initializing authentication...'}
            {isLoaded && isLoading && 'Loading user profile...'}
          </div>
        </div>
      </div>
    );
  }

  // Show language setup for new users
  if (isSignedIn && user && (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage)) {
    return (
      <LanguageSetup
        initialSource={sourceLanguage || 'darija'}
        initialTarget={targetLanguage || 'lebanese'}
        onComplete={(source, target) => {
          updateProfile({ sourceLanguage: source, targetLanguage: target });
        }}
      />
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      
      {/* OAuth callback route */}
      <Route path="/sso-callback" element={<SSOCallback />} />
      
      {/* Hybrid auth routes with full features and password manager support */}
      <Route 
        path="/login" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <HybridAuthForm mode="signin" />
          </div>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <HybridAuthForm mode="signup" />
          </div>
        } 
      />
      
      {/* Protected routes - simplified direct paths */}
      <Route 
        path="/hub" 
        element={isSignedIn ? <DashboardPage defaultTab="hub" /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quiz" 
        element={isSignedIn ? <DashboardPage defaultTab="quiz" /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/progress" 
        element={isSignedIn ? <DashboardPage defaultTab="progress" /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/culture" 
        element={isSignedIn ? <DashboardPage defaultTab="culture" /> : <Navigate to="/login" replace />} 
      />
      
      {/* Legacy dashboard routes - redirect to new simplified routes */}
      <Route 
        path="/dashboard" 
        element={isSignedIn ? <Navigate to="/hub" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/dashboard/:tab" 
        element={isSignedIn ? <DashboardRedirect /> : <Navigate to="/login" replace />} 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;