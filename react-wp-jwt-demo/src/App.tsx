import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { routes } from './routes'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          {routes.map((r) => (
            <Route key={r.path} path={r.path} element={<r.element />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}