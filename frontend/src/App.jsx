import React, { useEffect, useState } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import Register from './pages/Register'
import UserDashboard from './pages/userPages/UserDashboard'
import ArtistDashboard from './pages/artistPages/ArtistDashboard'
import LoginForm from './pages/LoginForm'

const ProtectedRoute = ({ allowedRole, children }) => {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    axios.get('http://localhost:3000/api/auth/me', { withCredentials: true })
      .then((response) => setUser(response.data.user))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) return null
  if (!user) return <Navigate to="/" replace />
  if (user.role !== allowedRole) {
    return <Navigate to={user.role === 'artist' ? '/artist/dashboard' : '/user/dashboard'} replace />
  }

  return children
}

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user/dashboard" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>} />
        <Route path="/artist/dashboard" element={<ProtectedRoute allowedRole="artist"><ArtistDashboard /></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App
