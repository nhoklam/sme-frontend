import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRoutes from './routes';
import { lightTheme } from './themes';
// @ts-ignore
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;