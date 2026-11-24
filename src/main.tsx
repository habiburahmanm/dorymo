import { initDomPatcher } from './lib/domPatcher';

// Protect React 19 reconciler against Google Translate / browser extensions DOM mutations
initDomPatcher();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MasterProvider } from './context/MasterContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MasterProvider>
      <App />
    </MasterProvider>
  </React.StrictMode>
);

/* PWA: register the service worker in production only (avoids dev caching). */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => { /* PWA is progressive — app still works without it */ });
  });
}
