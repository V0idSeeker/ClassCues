import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Installable app: register the service worker in the built game only (in development it would serve stale files).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register(`/sw.js?v=${__APP_VERSION__}`); });
}
