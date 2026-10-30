import React from 'react'
import LoginandRegister from './page/LoginandRegister.tsx'
import Navbar from './components/Navbar.tsx'

function App() {
  return (
    <main className="h-screen w-screen text-white bg-[#5c5470]">
      <Navbar />
      <LoginandRegister />
    </main>
  )
}

export default App