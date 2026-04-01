import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { API_BASE_URL } from './config/api'

// Expose API config to global scope for use in index.html
declare global {
  interface Window {
    __APP_CONFIG__: {
      API_BASE_URL: string;
    };
  }
}

window.__APP_CONFIG__ = {
  API_BASE_URL: API_BASE_URL
};

createRoot(document.getElementById("root")!).render(<App />);
