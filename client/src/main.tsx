import { StrictMode, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import App from './App';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const WithGoogle = ({ children }: { children: ReactNode }) =>
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider> : <>{children}</>;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <WithGoogle>
          <AuthProvider>
            <App />
          </AuthProvider>
        </WithGoogle>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
