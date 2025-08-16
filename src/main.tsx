import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// import AppDebug from './App.debug.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Using main app with error boundary for safety
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)