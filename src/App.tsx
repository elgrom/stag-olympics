import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'

function MainApp() {
  const [activeTab, setActiveTab] = useState<'scores' | 'forfeits' | 'teams'>('scores')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {activeTab === 'scores' && <div className="text-center pt-8 text-gray-500">Scores view — coming soon</div>}
      {activeTab === 'forfeits' && <div className="text-center pt-8 text-gray-500">Forfeit wheel — coming soon</div>}
      {activeTab === 'teams' && <div className="text-center pt-8 text-gray-500">Teams view — coming soon</div>}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function AdminApp() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <h1 className="text-xl font-bold">Admin Panel — coming soon</h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
