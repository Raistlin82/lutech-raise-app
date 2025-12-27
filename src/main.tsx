import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './stores/SettingsStore'
import { OpportunitiesProvider } from './stores/OpportunitiesStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <OpportunitiesProvider>
        <App />
      </OpportunitiesProvider>
    </SettingsProvider>
  </StrictMode>,
)
