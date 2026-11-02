import React from 'react'
import LoginandRegister from './page/LoginandRegister.tsx'
import Navbar from './components/Navbar.tsx'
import LandingPage from './page/LandingPage.tsx'

function App() {
  return (
    <main className="h-screen w-screen text-white bg-[#5c5470]">
      <Navbar />
      <LandingPage />
    </main>
  )
}

export default App