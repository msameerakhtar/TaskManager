import React, { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import theme from './theme/index'; 
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import CustomLoader from './components/CustomLoader';

const Home = lazy(() => import('./pages/Home'));
const Profile = lazy(() => import('./pages/Profile'));
const Layout = lazy(() => import('./layout/Layout'));
const Login = lazy(() => import('./features/auth/Login'));
const Signup = lazy(() => import('./features/auth/Signup'));
const TaskList = lazy(() => import('./features/tasks/TaskList'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const Blog = lazy(() => import('./pages/Blog'));
const Enterprise = lazy(() => import('./pages/Enterprise'));
const SuperAdminLayout = lazy(() => import('./layout/SuperAdminLayout'));
const SuperAdminOverview = lazy(() => import('./pages/admin/SuperAdminOverview'));
const SuperAdminUsers = lazy(() => import('./pages/admin/SuperAdminUsers'));
const SuperAdminWorkspaces = lazy(() => import('./pages/admin/SuperAdminWorkspaces'));
const SuperAdminAudit = lazy(() => import('./pages/admin/SuperAdminAudit'));
const SuperAdminRBAC = lazy(() => import('./pages/admin/SuperAdminRBAC'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
    <CustomLoader size={60} />
  </Box>
);

const App = () => {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const activeTheme = useMemo(() => {
    const currentMode = typeof mode === 'string' ? mode : 'light';
    return theme(currentMode);
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const handleSetMode = useCallback((newMode) => {
    if (typeof newMode === 'string') {
      setMode(newMode);
    } else {
      setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }
  }, []);

  const router = useMemo(() => createBrowserRouter([
    { 
      path: "/", 
      element: <Home setMode={handleSetMode} mode={mode} /> 
    }, 
    { 
      path: "/login", 
      element: <Login setMode={handleSetMode} mode={mode} /> 
    },
    { 
      path: "/signup", 
      element: <Signup setMode={handleSetMode} mode={mode} /> 
    },
    {
      element: (
        <ProtectedRoute>
          <Layout toggleTheme={toggleTheme} mode={mode} />
        </ProtectedRoute>
      ),
      children: [
        { path: '/tasks',            element: <TaskList /> },
        { path: '/profile',          element: <Profile /> },
        { path: '/contact',          element: <ContactUs /> },
        { path: '/blog',             element: <Blog /> },
        // Member-accessible (superadmin blocked — they have their own panel)
        {
          path: '/member-dashboard',
          element: (
            <RoleRoute>
              <MemberDashboard />
            </RoleRoute>
          )
        },
        // Admin-only routes — members and superadmins are redirected
        {
          path: '/admin-dashboard',
          element: (
            <RoleRoute requiredRole="admin">
              <AdminDashboard />
            </RoleRoute>
          )
        },
        {
          path: '/enterprise',
          element: (
            <RoleRoute requiredRole="admin" requiredPermission="enterprise:manage">
              <Enterprise />
            </RoleRoute>
          )
        },
      ]
    },
    {
      element: (
        <ProtectedRoute>
          <SuperAdminLayout toggleTheme={toggleTheme} mode={mode} />
        </ProtectedRoute>
      ),
      children: [
        { path: "/admin/overview", element: <SuperAdminOverview /> },
        { path: "/admin/users", element: <SuperAdminUsers /> },
        { path: "/admin/workspaces", element: <SuperAdminWorkspaces /> },
        { path: "/admin/audit", element: <SuperAdminAudit /> },
        { path: "/admin/rbac", element: <SuperAdminRBAC /> },
        { path: "/admin", element: <Navigate to="/admin/overview" replace /> }
      ]
    },
    { path: "*", element: <Navigate to="/" replace /> }
  ]), [mode, handleSetMode, toggleTheme]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{ async: true, defer: true }}
      >
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </GoogleReCaptchaProvider>
    </ThemeProvider>
  );
};

export default App;