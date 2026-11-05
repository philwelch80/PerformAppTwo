import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import './styles.css'
import App from './App.jsx'
import { StoreProvider } from './state/StoreContext.jsx'
import { ToastProvider } from './state/ToastContext.jsx'
import { ConfirmProvider } from './state/ConfirmContext.jsx'
import { PromptProvider } from './state/PromptContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <ToastProvider>
        <ConfirmProvider>
          <PromptProvider>
            <App />
          </PromptProvider>
        </ConfirmProvider>
      </ToastProvider>
    </StoreProvider>
  </StrictMode>,
)
