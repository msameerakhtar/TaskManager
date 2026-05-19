import { createTheme } from '@mui/material/styles';
import { getScrollbarStyles } from './scrollbar';

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
                hover: isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)',
                selected: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.08)',
            },
            divider: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
        },
        typography: {
            fontFamily: '"Inter", "Outfit", sans-serif',
            h1: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1
            },
            h2: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em'
            },
            h3: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em'
            },
            h4: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.01em'
            },
            h5: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.01em'
            },
            h6: {
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 600,
                letterSpacing: '-0.01em'
            },
            body1: {
                fontSize: '0.95rem',
                lineHeight: 1.6,
                letterSpacing: '-0.01em'
            },
            body2: {
                fontSize: '0.875rem',
                lineHeight: 1.57,
                letterSpacing: '-0.01em'
            },
            button: {
                fontFamily: '"Outfit", sans-serif',
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: '0.02em'
            },
            caption: {
                letterSpacing: '0.01em',
                lineHeight: 1.66
            },
            overline: {
                fontFamily: '"Outfit", sans-serif',
                letterSpacing: '0.1em',
                fontWeight: 700,
                textTransform: 'uppercase'
            }
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        boxShadow: 'none',
                        borderBottom: isDark
                            ? '1px solid rgba(255,255,255,0.08)'
                            : '1px solid rgba(0,0,0,0.05)',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '12px',
                        padding: '10px 24px',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: isDark
                                ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                                : '0 10px 15px -3px rgba(99, 102, 241, 0.2), 0 4px 6px -2px rgba(99, 102, 241, 0.1)',
                        },
                        '&:active': {
                            transform: 'translateY(0)',
                        },
                    },
                    containedPrimary: {
                        background: isDark
                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                            : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                        color: isDark ? '#0f172a' : '#ffffff',
                        border: '1px solid transparent',
                        '&:hover': {
                            background: isDark
                                ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                                : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                        },
                    },
                    outlined: {
                        borderWidth: '2px',
                        '&:hover': {
                            borderWidth: '2px',
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15, 23, 42, 0.03)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: '20px',
                        backgroundImage: 'none',
                        transition: 'box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out',
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: '20px',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                            borderColor: '#6366f1',
                            transform: 'translateY(-4px)',
                            boxShadow: isDark
                                ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
                                : '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)',
                        },
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '14px',
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#fcfcfd',
                            transition: 'all 0.2s ease-in-out',
                            '& fieldset': {
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                                borderWidth: '1.5px',
                            },
                            '&:hover fieldset': {
                                borderColor: '#6366f1',
                            },
                            '&.Mui-focused fieldset': {
                                borderWidth: '2px',
                            },
                            '& .MuiInputBase-input::placeholder': {
                                fontSize: '0.85rem',
                                opacity: 0.6,
                                transition: 'opacity 0.2s',
                            },
                            '&:hover .MuiInputBase-input::placeholder': {
                                opacity: 0.8,
                            }
                        },
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: `
                    .grecaptcha-badge { 
                        visibility: hidden !important;
                    }
                    ${getScrollbarStyles(mode)}
                `,
            },
        },
    });
};

export default theme;