import { useState, FormEvent } from 'react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'

interface ProfileData {
  id: string
  email: string
  full_name: string
  phone_num: string | null
  role: string
}

interface ProfilePageProps {
  profile: ProfileData
  onProfileUpdated: (updated: ProfileData) => void
  onBack: () => void
}

export function ProfilePage({ profile, onProfileUpdated, onBack }: ProfilePageProps) {
  const { showToast } = useToast()
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phoneNum, setPhoneNum] = useState(profile.phone_num || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      showToast('A név nem lehet üres!', 'error')
      return
    }
    setSaving(true)

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) {
      showToast('Hiba a mentéskor: ' + error.message, 'error')
      setSaving(false)
      return
    }

    let updated = data as ProfileData

    const { error: phoneError } = await supabase
      .from('profiles')
      .update({ phone_num: phoneNum.trim() || null })
      .eq('id', profile.id)

    if (phoneError && !phoneError.message.includes('phone_num')) {
      showToast('Hiba a telefonszám mentésekor: ' + phoneError.message, 'error')
    }

    onProfileUpdated({ ...updated, phone_num: phoneNum.trim() || null })
    showToast('Profil frissítve!')
    setSaving(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="profile-back" onClick={onBack}>← Vissza</button>
        <h2 className="profile-title">Profil</h2>
      </div>
      <form onSubmit={handleSave} className="profile-form">
        <div className="profile-field">
          <label className="profile-label">Email</label>
          <input type="email" className="profile-input profile-input-readonly" value={profile.email} readOnly disabled />
        </div>
        <div className="profile-field">
          <label className="profile-label">Teljes név</label>
          <input
            type="text"
            className="profile-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Teljes név"
            required
          />
        </div>
        <div className="profile-field">
          <label className="profile-label">Telefonszám</label>
          <input
            type="tel"
            className="profile-input"
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            placeholder="Telefonszám (opcionális)"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Mentés...' : 'Mentés'}
        </button>
      </form>
    </div>
  )
}
