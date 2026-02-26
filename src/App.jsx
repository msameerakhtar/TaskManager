import React, { useState, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme/index'; 
import Home from './pages/Home';
import Profile from './pages/Profile'; 
import Layout from './layout/Layout'; 
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import TaskList from './features/tasks/TaskList';
import ProtectedRoute from './routes/ProtectedRoute';
import ContactUs from './pages/ContactUs';
import Blog from './pages/Blog';

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
        { path: "/contact", element: <ContactUs /> },
        { path: "/blog", element: <Blog /> }
      ]
    },
    { path: "*", element: <Navigate to="/" replace /> }
  ]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

export default App;