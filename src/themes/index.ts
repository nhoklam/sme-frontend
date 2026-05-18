import { createTheme } from '@mui/material/styles';

// Theme sáng - Bookly Brand
export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1a1a2e', // Deep Navy
            light: '#31314d',
            dark: '#0f0f1c',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#f5a623', // Gold Accent
            light: '#f7b84d',
            dark: '#db941e',
            contrastText: '#ffffff',
        },
        success: {
            main: '#4caf50',
        },
        warning: {
            main: '#ff9800',
        },
        error: {
            main: '#f44336',
        },
        info: {
            main: '#2196f3',
        },
        background: {
            default: '#f9f9f9',
            paper: '#ffffff',
        },
        text: {
            primary: '#333333',
            secondary: '#666666',
        }
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        h1: { fontWeight: 700, color: '#1a1a2e' },
        h2: { fontWeight: 700, color: '#1a1a2e' },
        h3: { fontWeight: 600, color: '#1a1a2e' },
        h4: { fontWeight: 600, color: '#1a1a2e' },
        h5: { fontWeight: 600, color: '#1a1a2e' },
        h6: { fontWeight: 600, color: '#1a1a2e' },
        button: {
            fontWeight: 600,
        }
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '8px 24px',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                },
                containedPrimary: {
                    backgroundColor: '#1a1a2e',
                    '&:hover': {
                        backgroundColor: '#31314d',
                    }
                },
                containedSecondary: {
                    backgroundColor: '#f5a623',
                    color: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#db941e',
                    }
                }
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: '0.3s ease',
                    '&:hover': {
                        boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                    }
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove weird overlay on dark mode if active
                }
            }
        }
    },
});

// Theme tối (Bỏ qua trong Phase 1 nhưng giữ khung)
export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f5a623',
        },
        secondary: {
            main: '#1a1a2e',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 600 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 8,
    },
});

export default lightTheme;