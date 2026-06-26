import { useState, useRef, useEffect } from 'react'
import '../styles/DeliveryTypeSelect.css'

interface DeliveryTypeSelectProps {
  onSelect: (type: 'black' | 'white') => void
  value: 'black' | 'white'
}

export function DeliveryTypeSelect({ onSelect, value }: DeliveryTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<'black' | 'white'>(value)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelected(value)
  }, [value])

  const options = [
    { value: 'black' as const, label: '⚫ Fekete', color: 'black' },
    { value: 'white' as const, label: '⚪ Fehér', color: 'white' },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: 'black' | 'white') => {
    setSelected(optionValue)
    onSelect(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find((opt) => opt.value === selected)

  return (
    <div className="delivery-type-select" ref={dropdownRef}>
      <button
        type="button"
        className="delivery-type-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="delivery-type-label">
          {selectedOption ? selectedOption.label : 'Válassza ki a szállítási típust'}
        </span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="delivery-type-dropdown">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`delivery-type-option ${selected === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
