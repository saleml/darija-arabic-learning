import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LanguageSetup from './components/LanguageSetup';

function App() {
  const { user, isLoading, sourceLanguage, targetLanguage, updateLanguagePreferences } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show language setup for new users
  if (user && (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage)) {
    return (
      <LanguageSetup
        initialSource={sourceLanguage || 'darija'}
        initialTarget={targetLanguage || 'lebanese'}
        onComplete={(source, target) => {
          updateLanguagePreferences(source, target);
        }}
      />
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
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