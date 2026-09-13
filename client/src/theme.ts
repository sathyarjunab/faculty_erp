import { createTheme, alpha } from '@mui/material/styles';

const NAVY = '#1e3a5f';
const NAVY_DARK = '#152a45';
const ACCENT = '#e08a1e';
const INDIGO = '#3b5bdb';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: NAVY, light: '#3d6396', dark: NAVY_DARK, contrastText: '#ffffff' },
    secondary: { main: ACCENT, contrastText: '#ffffff' },
    info: { main: INDIGO },
    success: { main: '#1f9254' },
    warning: { main: '#e08a1e' },
    error: { main: '#d64545' },
    background: { default: '#eef2f7', paper: '#ffffff' },
    text: { primary: '#1a2233', secondary: '#5a6b82' },
    divider: 'rgba(30,58,95,0.10)',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: `'Segoe UI', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif`,
    h4: { fontWeight: 800, letterSpacing: '-0.5px' },
    h5: { fontWeight: 800, letterSpacing: '-0.3px' },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 700 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#eef2f7' },
        '*::-webkit-scrollbar': { width: 10, height: 10 },
        '*::-webkit-scrollbar-thumb': { background: 'rgba(30,58,95,0.22)', borderRadius: 8 },
        '*::-webkit-scrollbar-thumb:hover': { background: 'rgba(30,58,95,0.35)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(90deg, ${NAVY_DARK} 0%, ${NAVY} 60%, ${NAVY} 100%)`,
          boxShadow: '0 1px 8px rgba(16,24,40,0.18)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid rgba(30,58,95,0.08)', backgroundColor: '#ffffff' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(30,58,95,0.08)',
          boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 9, fontWeight: 600 },
        containedPrimary: {
          backgroundImage: `linear-gradient(90deg, ${NAVY} 0%, #2c5487 100%)`,
        },
      },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha(NAVY, 0.1),
            color: NAVY,
            fontWeight: 700,
            '& .MuiListItemIcon-root': { color: NAVY },
            '&:hover': { backgroundColor: alpha(NAVY, 0.16) },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          color: '#5a6b82',
          backgroundColor: '#f6f8fb',
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 9 } } },
  },
});

export default theme;
