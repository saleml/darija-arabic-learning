import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useAuth } from './contexts/SimpleAuthContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LanguageSetup from './components/LanguageSetup';

function App() {
  const { isLoaded, isSignedIn } = useUser();
  const { user, sourceLanguage, targetLanguage, updateProfile, isLoading } = useAuth();
  
  console.log('App - isLoaded:', isLoaded, 'isLoading:', isLoading, 'isSignedIn:', isSignedIn, 'user:', user?.id);
  
  // Show loading state while Clerk is initializing
  if (!isLoaded || isLoading) {
    console.log('App showing loading screen...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
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
      
      {/* Clerk sign-in/up routes */}
      <Route 
        path="/login" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <SignIn 
              routing="path" 
              path="/login"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-2xl"
                }
              }}
            />
          </div>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <SignUp 
              routing="path" 
              path="/signup"
              afterSignUpUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-2xl"
                }
              }}
            />
          </div>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={isSignedIn ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/dashboard/:tab" 
        element={isSignedIn ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quiz" 
        element={isSignedIn ? <Navigate to="/dashboard/quiz" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/progress" 
        element={isSignedIn ? <Navigate to="/dashboard/progress" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/culture" 
        element={isSignedIn ? <Navigate to="/dashboard/culture" replace /> : <Navigate to="/login" replace />} 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;