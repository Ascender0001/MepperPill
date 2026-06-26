import { IconManager } from './icons'

interface NavBarProps {
  fullName: string
  email: string
  role: 'driver' | 'manager'
  onLogout: () => void
  onNavigateProfile: () => void
}

export function NavBar({ fullName, email, role, onLogout, onNavigateProfile }: NavBarProps) {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <span className="navbar-title">🍕 Mepper Pill</span>
      </div>
      <div className="navbar-right">
        <span className="navbar-role">{role === 'driver' ? '🚗 Futár' : <><IconManager size={14} /> Menedzser</>}</span>
        <span className="navbar-user">{fullName || email}</span>
        <button className="navbar-btn" onClick={onNavigateProfile}>Profil</button>
        <button className="navbar-btn navbar-btn-logout" onClick={onLogout}>Kilépés</button>
      </div>
    </div>
  )
}
