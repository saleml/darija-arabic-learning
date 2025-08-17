import { Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useAuth } from './contexts/ClerkAuthContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LanguageSetup from './components/LanguageSetup';

function App() {
  const { user, sourceLanguage, targetLanguage, updateProfile } = useAuth();

  // Show language setup for new users
  if (user && (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage)) {
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
        element={user ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/dashboard/:tab" 
        element={user ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quiz" 
        element={user ? <Navigate to="/dashboard/quiz" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/progress" 
        element={user ? <Navigate to="/dashboard/progress" replace /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/culture" 
        element={user ? <Navigate to="/dashboard/culture" replace /> : <Navigate to="/login" replace />} 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;