import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './ui/theme.css';
import './styles/globals.css';

// Ensure DOM is ready before mounting React
// This is necessary because Vite moves scripts to <head> in production builds
function initApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Wait for DOM if not already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
