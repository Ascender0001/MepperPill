import { useState, useRef, useEffect } from 'react'
import '../styles/SearchDropdown.css'

interface SearchDropdownProps {
  items: Array<{ id: string | number; label: string }>
  onSelect: (id: string | number) => void
  placeholder?: string
}

export function SearchDropdown({ items, onSelect, placeholder = 'Keresés...' }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: string | number) => {
    setSelectedId(id)
    onSelect(id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedLabel = items.find((item) => item.id === selectedId)?.label

  return (
    <div className="search-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabel || placeholder}
      </button>

      {isOpen && (
        <div className="dropdown-container">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Írjon a kereséshez..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="dropdown-list">
            {filtered.length === 0 ? (
              <div className="dropdown-empty">Nincsenek találatok</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`dropdown-item ${selectedId === item.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.id)}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
