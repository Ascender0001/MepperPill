import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { AuthPage } from './components/AuthPage'
import { ManagerDashboard } from './components/ManagerDashboard'
import { DriverDashboard } from './components/DriverDashboard'
import './style.css'

interface Profile {
  id: string
  email: string
  full_name: string
  role: string
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) void loadProfile(s.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
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
    // Session will be picked up by onAuthStateChange
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

export default App
