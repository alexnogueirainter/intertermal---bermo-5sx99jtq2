/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './main.css'
import { Mail } from './components/ui/mail-icon'

// Polyfill global Mail as fallback for components missing local import
if (typeof window !== 'undefined') {
  ;(window as any).Mail = Mail
}
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).Mail = Mail
}
try {
  // @ts-expect-error
  if (typeof global !== 'undefined') {
    // @ts-expect-error
    global.Mail = Mail
  }
} catch {
  /* intentionally ignored */
}

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
