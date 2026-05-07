import React, { lazy, Suspense, useState, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
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

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSetMode = (newMode) => {
    if (typeof newMode === 'string') {
      setMode(newMode);
    } else {
      setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    }
  };

  const router = createBrowserRouter([
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
        { path: "/enterprise", element: <Enterprise /> },
        { path: "/contact", element: <ContactUs /> },
        { path: "/blog", element: <Blog /> }
      ]
    },
    { path: "*", element: <Navigate to="/" replace /> }
  ]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
};

export default App;