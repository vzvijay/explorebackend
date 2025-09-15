import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import PropertySurveyForm from './pages/PropertySurveyForm';
import EditPropertyPage from './pages/EditPropertyPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
import LoadingSpinner from './components/Common/LoadingSpinner';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Runtime Material-UI style injection to fix button visibility in production
const injectMaterialUIStyles = () => {
  const muiStyles = `
    /* Material-UI Button Styles */
    .MuiButton-root {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 64px !important;
      padding: 6px 16px !important;
      border-radius: 4px !important;
      border: 0 !important;
      cursor: pointer !important;
      text-transform: uppercase !important;
      font-weight: 500 !important;
      font-size: 0.875rem !important;
      line-height: 1.75 !important;
      letter-spacing: 0.02857em !important;
      color: inherit !important;
      background-color: transparent !important;
      transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
    }
    
    .MuiButton-root:hover {
      background-color: rgba(0, 0, 0, 0.04) !important;
    }
    
    .MuiButton-root.MuiButton-contained {
      background-color: #1976d2 !important;
      color: white !important;
      box-shadow: 0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12) !important;
    }
    
    .MuiButton-root.MuiButton-contained:hover {
      background-color: #1565c0 !important;
    }
    
    .MuiButton-root.MuiButton-outlined {
      border: 1px solid rgba(25, 118, 210, 0.5) !important;
      color: #1976d2 !important;
    }
    
    .MuiButton-root.MuiButton-outlined:hover {
      background-color: rgba(25, 118, 210, 0.04) !important;
    }
    
    /* Material-UI IconButton Styles */
    .MuiIconButton-root {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      position: relative !important;
      box-sizing: border-box !important;
      background-color: transparent !important;
      outline: 0 !important;
      border: 0 !important;
      margin: 0 !important;
      cursor: pointer !important;
      user-select: none !important;
      vertical-align: middle !important;
      appearance: none !important;
      text-decoration: none !important;
      color: inherit !important;
      padding: 8px !important;
      border-radius: 50% !important;
      transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
    }
    
    .MuiIconButton-root:hover {
      background-color: rgba(0, 0, 0, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorPrimary {
      color: #1976d2 !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorPrimary:hover {
      background-color: rgba(25, 118, 210, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorSecondary {
      color: #dc004e !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorSecondary:hover {
      background-color: rgba(220, 0, 78, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorError {
      color: #d32f2f !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorError:hover {
      background-color: rgba(211, 47, 47, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorWarning {
      color: #ed6c02 !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorWarning:hover {
      background-color: rgba(237, 108, 2, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorSuccess {
      color: #2e7d32 !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorSuccess:hover {
      background-color: rgba(46, 125, 50, 0.04) !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorInfo {
      color: #0288d1 !important;
    }
    
    .MuiIconButton-root.MuiIconButton-colorInfo:hover {
      background-color: rgba(2, 136, 209, 0.04) !important;
    }
    
    /* Material-UI TableCell Styles */
    .MuiTableCell-root {
      display: table-cell !important;
      padding: 16px !important;
      font-size: 0.875rem !important;
      text-align: left !important;
      font-weight: 400 !important;
      line-height: 1.43 !important;
      border-bottom: 1px solid rgba(224, 224, 224, 1) !important;
      letter-spacing: 0.01071em !important;
      vertical-align: inherit !important;
    }
    
    .MuiTableCell-head {
      color: rgba(0, 0, 0, 0.87) !important;
      font-weight: 500 !important;
      line-height: 1.5rem !important;
    }
    
    .MuiTableCell-body {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Material-UI TableRow Styles */
    .MuiTableRow-root {
      color: inherit !important;
      display: table-row !important;
      vertical-align: middle !important;
      outline: 0px !important;
    }
    
    .MuiTableRow-root:hover {
      background-color: rgba(0, 0, 0, 0.04) !important;
    }
    
    /* Material-UI Stack Styles */
    .MuiStack-root {
      display: flex !important;
      flex-direction: column !important;
      flex-grow: 1 !important;
      flex-shrink: 1 !important;
      flex-basis: 0% !important;
    }
    
    .MuiStack-root.MuiStack-direction-row {
      flex-direction: row !important;
    }
    
    .MuiStack-root.MuiStack-spacing-1 > :not(style) + :not(style) {
      margin-left: 8px !important;
    }
    
    .MuiStack-root.MuiStack-spacing-2 > :not(style) + :not(style) {
      margin-left: 16px !important;
    }
    
    .MuiStack-root.MuiStack-spacing-3 > :not(style) + :not(style) {
      margin-left: 24px !important;
    }
    
    .MuiStack-root.MuiStack-spacing-4 > :not(style) + :not(style) {
      margin-left: 32px !important;
    }
  `;
  
  // Check if styles are already injected
  if (!document.getElementById('mui-runtime-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'mui-runtime-styles';
    styleElement.textContent = muiStyles;
    document.head.appendChild(styleElement);
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:id/edit" element={<EditPropertyPage />} />
        <Route path="survey" element={<PropertySurveyForm />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="super-admin" element={<SuperAdminDashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  // Inject Material-UI styles at runtime to fix button visibility in production
  useEffect(() => {
    injectMaterialUIStyles();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 