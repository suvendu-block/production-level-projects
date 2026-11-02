import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import Navbar from './components/Navbar.tsx'
import LandingPage from './page/LandingPage.tsx'
import Dashboard from './page/Dashboard.tsx'

function App() {
  const { isSignedIn } = useUser();
  return (
    <main className="h-screen w-screen text-white bg-black overflow-auto">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={isSignedIn ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </main>
  )
}

export default App
