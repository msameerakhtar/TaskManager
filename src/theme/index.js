import { createTheme } from '@mui/material/styles';

const theme = (mode) => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? '#94a3b8' : '#0f172a', 
                light: isDark ? '#cbd5e1' : '#334155',
                dark: isDark ? '#64748b' : '#000000',
            },
            secondary: {
                main: '#6366f1', 
            },
            background: {
                default: isDark ? '#0f172a' : '#f8fafc',
                paper: isDark ? '#1e293b' : '#ffffff',
            },
            text: {
                primary: isDark ? '#f1f5f9' : '#1e293b',
                secondary: isDark ? '#94a3b8' : '#475569',
            },
            action: {
                hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
        typography: {
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            h1: { fontWeight: 800, letterSpacing: '-0.025em' },
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        boxShadow: isDark 
                            ? '0 4px 20px rgba(0,0,0,0.4)' 
                            : '0 1px 3px rgba(0,0,0,0.1)',
                        borderBottom: isDark 
                            ? '1px solid rgba(255,255,255,0.08)' 
                            : '1px solid #e2e8f0',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '10px', 
                        padding: '10px 24px',
                        transition: 'all 0.2s ease-in-out',
                    },
                    containedPrimary: {
                        backgroundColor: isDark ? '#f1f5f9' : '#0f172a',
                        color: isDark ? '#0f172a' : '#ffffff',
                        '&:hover': {
                            backgroundColor: isDark ? '#ffffff' : '#1e293b',
                            transform: 'translateY(-1px)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '16px',
                        backgroundImage: 'none',
                        boxShadow: isDark 
                            ? '0 10px 15px -3px rgba(0,0,0,0.3)' 
                            : '0 4px 6px -1px rgba(0,0,0,0.05)',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '16px',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f1f5f9',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        '&:hover': {
                            borderColor: '#6366f1',
                            boxShadow: isDark 
                                ? '0 20px 25px -5px rgba(0,0,0,0.4)' 
                                : '0 10px 15px -3px rgba(0,0,0,0.1)',
                        },
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                            '& fieldset': { 
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' 
                            },
                            '&:hover fieldset': { 
                                borderColor: '#6366f1' 
                            },
                        },
                    },
                },
            },
        },
    });
};

export default theme;