import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './stores/SettingsStore'
import { CustomerProvider } from './stores/CustomerStore'
import { OpportunitiesProvider } from './stores/OpportunitiesStore'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <CustomerProvider>
        <OpportunitiesProvider>
          <App />
        </OpportunitiesProvider>
      </CustomerProvider>
    </SettingsProvider>
  </StrictMode>,
)
