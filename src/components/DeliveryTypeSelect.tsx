import '../styles/DeliveryTypeSelect.css'

interface DeliveryTypeSelectProps {
  onSelect: (type: 'black' | 'white') => void
  value: 'black' | 'white'
}

export function DeliveryTypeSelect({ onSelect, value }: DeliveryTypeSelectProps) {
  return (
    <div className="delivery-type-switch">
      <button
        type="button"
        className={`switch-btn ${value === 'black' ? 'active black' : ''}`}
        onClick={() => onSelect('black')}
      >
        ⚫ Fekete
      </button>
      <button
        type="button"
        className={`switch-btn ${value === 'white' ? 'active white' : ''}`}
        onClick={() => onSelect('white')}
      >
        ⚪ Fehér
      </button>
    </div>
  )
}
