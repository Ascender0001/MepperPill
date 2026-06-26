import { useState, useEffect } from 'react'
import { type Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import { AuthPage } from './components/AuthPage'
import { ManagerDashboard } from './components/ManagerDashboard'
import { DriverDashboard } from './components/DriverDashboard'
import { NavBar } from './components/NavBar'
import { ProfilePage } from './components/ProfilePage'
import { ToastProvider } from './components/Toast'
import './style.css'

interface Profile {
  id: string
  email: string
  full_name: string
  phone_num: string | null
  role: string
}

function AppInner() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<'dashboard' | 'profile'>('dashboard')

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

  const handleAuth = () => {}

  const handleProfileUpdated = (updated: Profile) => {
    setProfile(updated)
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

  return (
    <div className="container">
      <NavBar
        fullName={profile.full_name}
        email={profile.email}
        role={profile.role as 'driver' | 'manager'}
        onLogout={handleLogout}
        onNavigateProfile={() => setPage('profile')}
      />
      {page === 'profile' ? (
        <ProfilePage profile={profile} onProfileUpdated={handleProfileUpdated} onBack={() => setPage('dashboard')} />
      ) : profile.role === 'manager' ? (
        <ManagerDashboard userProfile={profile} />
      ) : (
        <DriverDashboard userProfile={profile} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  )
}
