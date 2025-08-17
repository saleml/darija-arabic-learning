import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
// import AppDebug from './App.debug.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

// Using main app with error boundary for safety
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
)