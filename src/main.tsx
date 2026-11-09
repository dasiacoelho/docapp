import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "./index.css";
import App from "./App.tsx";

function ErrorFallback({ error, resetErrorBoundary }) {
  console.error("Error caught by boundary:", error);
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'system-ui',
      maxWidth: '600px',
      margin: '50px auto',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
      <pre style={{ textAlign: 'left', background: '#fef2f2', padding: '16px', borderRadius: '8px', overflow: 'auto', color: '#991b1b', fontSize: '0.8rem' }}>
        {error?.message || 'Unknown error'}
        {error?.stack && `\n\n${error.stack}`}
      </pre>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={resetErrorBoundary}
          style={{ 
            padding: '10px 20px', 
            background: '#0284c7', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Try again
        </button>
        <button 
          onClick={() => {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(r => r.unregister());
              });
            }
            window.location.reload();
          }}
          style={{ 
            padding: '10px 20px', 
            background: '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          Clear cache & reload
        </button>
      </div>
      <p style={{ marginTop: '20px', color: '#64748b', fontSize: '0.875rem' }}>
        If this persists, open DevTools (F12) → Console for details.
      </p>
    </div>
  );
}

// Force service worker update on controller change
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);