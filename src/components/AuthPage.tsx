import { useState, FormEvent } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/Auth.css'
import { IconPizza, IconDriver, IconManager } from './icons'

interface AuthPageProps {
  onAuth: () => void
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'driver' | 'manager'>('driver')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        })

        if (signUpError) {
          setError(signUpError.message)
        } else {
          setSuccess('Sikeres regisztráció! Most már bejelentkezhet.')
          setMode('login')
          setPassword('')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
        } else {
          onAuth()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <IconPizza size={30} /> Mepper Pill
        </h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
        </p>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
          >
            Bejelentkezés
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
          >
            Regisztráció
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Teljes név</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Teljes név"
                required
                className="auth-input"
              />
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="auth-input"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Jelszó</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="auth-input"
            />
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label className="auth-label">Szerepkör</label>
              <div className="role-options">
                <button
                  type="button"
                  className={`role-option ${role === 'driver' ? 'selected' : ''}`}
                  onClick={() => setRole('driver')}
                >
                  <span className="role-icon"><IconDriver size={24} /></span>
                  <span className="role-name">Futár</span>
                </button>
                <button
                  type="button"
                  className={`role-option ${role === 'manager' ? 'selected' : ''}`}
                  onClick={() => setRole('manager')}
                >
                  <span className="role-icon"><IconManager size={24} /></span>
                  <span className="role-name">Menedzser</span>
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? 'Kérjük várjon...'
              : mode === 'login'
                ? 'Bejelentkezés'
                : 'Regisztráció'}
          </button>
        </form>
      </div>
    </div>
  )
}
