import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig/authConfig.ts";
import { AlatContextProvider } from './context/AlatContextProvider.tsx';

const msalInstance = new PublicClientApplication(msalConfig);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
  <MsalProvider instance={msalInstance}>
    <AlatContextProvider>

    <App />
    </AlatContextProvider>
  </MsalProvider>
</StrictMode>,
)
