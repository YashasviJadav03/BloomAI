import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './hooks/app'
import { SettingsProvider } from './hooks/settings'
import '@fontsource-variable/nunito'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
