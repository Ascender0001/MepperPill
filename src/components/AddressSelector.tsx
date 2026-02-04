import { useState, useRef, useEffect } from 'react'
import '../styles/AddressSelector.css'

interface AddressSelectorProps {
  addresses: Array<{ id: number; name: string }>
  onSelect: (addressName: string, addressId?: number) => void
  placeholder?: string
}

export function AddressSelector({ addresses, onSelect, placeholder = '📍 Válasszon vagy írjon be új címet' }: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAddress, setSelectedAddress] = useState<{ id?: number; name: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = addresses.filter((addr) =>
    addr.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isNewAddress = searchTerm.trim().length > 0 && !addresses.some((a) => a.name.toLowerCase() === searchTerm.toLowerCase())

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: number | undefined, name: string) => {
    setSelectedAddress({ id, name })
    onSelect(name, id)
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
    if (!selectedAddress || selectedAddress.name !== e.target.value) {
      setSelectedAddress(null)
    }
  }

  return (
    <div className="address-selector" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="address-selector-input"
        placeholder={placeholder}
        value={searchTerm || selectedAddress?.name || ''}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && (
        <div className="address-selector-dropdown">
          {filtered.length > 0 && (
            <div className="dropdown-section">
              <div className="section-label">Meglévő címek</div>
              {filtered.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  className={`address-option ${selectedAddress?.id === addr.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(addr.id, addr.name)}
                >
                  {addr.name}
                </button>
              ))}
            </div>
          )}

          {isNewAddress && (
            <div className="dropdown-section">
              <div className="section-label">Új cím</div>
              <button
                type="button"
                className="address-option new-address"
                onClick={() => handleSelect(undefined, searchTerm.trim())}
              >
                <span className="plus-icon">+</span> {searchTerm.trim()}
              </button>
            </div>
          )}

          {filtered.length === 0 && !isNewAddress && (
            <div className="no-results">
              Kezdje el begépelni a cím nevét
            </div>
          )}
        </div>
      )}
    </div>
  )
}
