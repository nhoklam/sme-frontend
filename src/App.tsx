import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './routes';
import { lightTheme } from './themes';
import { ConfirmProvider } from './contexts/ConfirmContext';
// @ts-ignore
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <ConfirmProvider>
          <AppRoutes />
        </ConfirmProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;