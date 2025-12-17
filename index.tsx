
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './context/I18nContext';
import { initializeLocationService } from './services/locationService';
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger';
import { initSentry } from './config/monitoring';

// Initialize Sentry error monitoring
try {
  initSentry();
} catch (error) {
  console.warn('Sentry initialization failed:', error);
}

// Initialize location service on app start (non-blocking)
initializeLocationService().catch((error) => {
  logger.error('Failed to initialize location service', error);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Show immediate loading state
rootElement.innerHTML = `
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="text-align: center; color: white;">
      <div style="width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; margin: 0 auto 1rem; animation: spin 1s linear infinite;"></div>
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem;">Loading Kobonz...</h2>
      <p style="opacity: 0.9;">Please wait</p>
    </div>
  </div>
  <style>
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
`;

const root = ReactDOM.createRoot(rootElement);

// Render app with timeout fallback
const renderTimeout = setTimeout(() => {
  logger.error('App render timeout - possible initialization issue');
}, 10000);

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  clearTimeout(renderTimeout);
} catch (error) {
  clearTimeout(renderTimeout);
  logger.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6;">
      <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937;">Unable to Load</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" style="background: #007AFF; color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}