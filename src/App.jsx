import React, { lazy, Suspense, useState, useMemo, useCallback } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
// import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import theme from './theme/index'; 
import ProtectedRoute from './routes/ProtectedRoute';
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
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MemberDashboard = lazy(() => import('./pages/MemberDashboard'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
    <CustomLoader size={60} />
  </Box>
);

const App = () => {
  const [mode, setMode] = useState('dark');

  const activeTheme = useMemo(() => {
    const currentMode = typeof mode === 'string' ? mode : 'dark';
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
        { path: "/tasks", element: <TaskList /> },
        { path: "/profile", element: <Profile /> },
        { path: "/member-dashboard", element: <MemberDashboard /> },
        { path: "/enterprise", element: <Enterprise /> },
        { path: "/superadmin", element: <SuperAdmin /> },
        { path: "/admin-dashboard", element: <AdminDashboard /> },
        { path: "/contact", element: <ContactUs /> },
        { path: "/blog", element: <Blog /> }
      ]
    },
    { path: "*", element: <Navigate to="/" replace /> }
  ]), [mode, handleSetMode, toggleTheme]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      {/* <GoogleReCaptchaProvider
        reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
        scriptProps={{ async: true, defer: true }}
      > */}
        <Suspense fallback={<PageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      {/* </GoogleReCaptchaProvider> */}
    </ThemeProvider>
  );
};

export default App;