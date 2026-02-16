import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', 
    },
    secondary: {
      main: '#4caf50', 
    },
    background: {
      default: '#f4f7fe', 
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 900, color: '#1a237e' },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 'bold',
          padding: '10px 20px',
        },
        containedPrimary: {
          boxShadow: '0 10px 20px rgba(26, 35, 126, 0.2)',
          '&:hover': { backgroundColor: '#0d134a' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: '#f9f9f9',
            transition: '0.3s',
            '& fieldset': { borderColor: '#e0e0e0' },
            '&:hover fieldset': { borderColor: '#1a237e' },
            '&.Mui-focused fieldset': { borderColor: '#1a237e', borderWidth: '2px' },
          },
          '& label.Mui-focused': { color: '#1a237e' },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
        },
        elevation0: {
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
          '&:hover': { 
            transform: 'scale(1.03)', 
            boxShadow: '0 15px 35px rgba(0,0,0,0.15)' 
          },
        },
      },
    },
  },
});

export default theme;