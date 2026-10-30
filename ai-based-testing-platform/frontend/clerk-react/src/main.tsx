import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from "@clerk/react";
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <ClerkProvider
  
  publishableKey='pk_test_Zmx5aW5nLXN0YXJmaXNoLTEzODguY2xlcmsuYWNjb3VudHMuZGV2JA'
  >
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </ClerkProvider>
)
