import { useState, useEffect } from 'react'
import { type Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { AuthPage } from './components/AuthPage'
import { ManagerDashboard } from './components/ManagerDashboard'
import { DriverDashboard } from './components/DriverDashboard'
import { ToastProvider } from './components/Toast'
import './style.css'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

function AppInner() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) void loadProfile(s.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) void loadProfile(s.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const handleAuth = () => {
  }

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h1>🍕 Mepper Pill</h1>
        <p style={{ color: '#ff6b00', marginTop: '20px' }}>Betöltés...</p>
      </div>
    )
  }

  if (!session || !profile) {
    return <AuthPage onAuth={handleAuth} />
  }

  if (profile.role === 'manager') {
    return <ManagerDashboard userProfile={profile} onLogout={handleLogout} />
  }

  return <DriverDashboard userProfile={profile} onLogout={handleLogout} />
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
