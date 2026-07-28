import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
// @ts-ignore: side-effect CSS import without type declarations
import './index.css';

// Remove any previously stored dark mode — dark mode is no longer supported
document.documentElement.classList.remove('dark');
try {
  const s = localStorage.getItem('agentSettings');
  if (s) {
    const parsed = JSON.parse(s);
    if ('darkMode' in parsed) {
      delete parsed.darkMode;
      localStorage.setItem('agentSettings', JSON.stringify(parsed));
    }
  }
} catch { /* ignore */ }


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
