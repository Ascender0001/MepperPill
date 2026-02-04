import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { AddressSelector } from './components/AddressSelector'
import './style.css'

interface Address {
  id: number
  name: string
  address: string
}

interface Order {
  id: number
  addressId: number
  addressName: string
  type: 'black' | 'white'
  details: string
  price: number
  timestamp: string
}

function App() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'settlement'>('orders')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set())
  const [selectedOrderAddressName, setSelectedOrderAddressName] = useState('')

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deliveryAppData')
    if (saved) {
      const data = JSON.parse(saved)
      setAddresses(data.addresses || [])
      setOrders(data.orders || [])
    }
  }, [])

  // Save data to localStorage
  const saveData = (newAddresses: Address[], newOrders: Order[]) => {
    localStorage.setItem('deliveryAppData', JSON.stringify({ addresses: newAddresses, orders: newOrders }))
  }

  const handleAddOrder = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const addressName = selectedOrderAddressName.trim()
    const type = (form.elements.namedItem('orderType') as HTMLSelectElement).value as 'black' | 'white'
    const details = (form.elements.namedItem('orderDetails') as HTMLInputElement).value.trim()
    const price = parseFloat((form.elements.namedItem('orderPrice') as HTMLInputElement).value)

    if (addressName && type && price >= 0) {
      let address = addresses.find((a) => a.name.toLowerCase() === addressName.toLowerCase())
      let newAddresses = addresses
      
      // Ha nincs ilyen cím, akkor létrehoz egy újat
      if (!address) {
        const newAddress: Address = {
          id: Date.now(),
          name: addressName,
          address: addressName,
        }
        newAddresses = [...addresses, newAddress]
        address = newAddress
        setAddresses(newAddresses)
      }

      if (address) {
        const newOrder: Order = {
          id: Date.now(),
          addressId: address.id,
          addressName: address.name,
          type,
          details,
          price,
          timestamp: new Date().toLocaleTimeString(),
        }
        const newOrders = [...orders, newOrder]
        setOrders(newOrders)
        saveData(newAddresses, newOrders)
        form.reset()
        setSelectedOrderAddressName('')
      }
    }
  }

  const handleDeleteOrder = (id: number) => {
    const newOrders = orders.filter((o) => o.id !== id)
    setOrders(newOrders)
    saveData(addresses, newOrders)
  }

  const handleClearOrders = () => {
    if (orders.length > 0 && confirm('Biztosan szeretné törölni az összes megrendelést?')) {
      setOrders([])
      saveData(addresses, [])
    }
  }

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.addressName.toLowerCase().includes(orderSearchTerm.toLowerCase())
    const matchesType = orderTypeFilter === 'all' || order.type === orderTypeFilter
    return matchesSearch && matchesType
  })

  const handleCheckOrder = (orderId: number) => {
    const newCheckedOrders = new Set(checkedOrders)
    if (newCheckedOrders.has(orderId)) {
      newCheckedOrders.delete(orderId)
    } else {
      newCheckedOrders.add(orderId)
    }
    setCheckedOrders(newCheckedOrders)
  }

  const getSettlementTotals = () => {
    const checkedOrdersList = orders.filter((order: Order) => checkedOrders.has(order.id))
    const totalAll = checkedOrdersList.reduce((sum: number, order: Order) => sum + order.price, 0)
    const totalBlack = checkedOrdersList.filter((order: Order) => order.type === 'black').reduce((sum: number, order: Order) => sum + order.price, 0)
    const totalWhite = checkedOrdersList.filter((order: Order) => order.type === 'white').reduce((sum: number, order: Order) => sum + order.price, 0)
    return { totalAll, totalBlack, totalWhite, count: checkedOrdersList.length }
  }

  return (
    <div className="container">
      <h1>📦 Mepper Pill</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Megrendelések
        </button>
        <button
          className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlement')}
        >
          Elszámolás
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="tab-content">
          <h2>Mai Megrendelések</h2>
          <form onSubmit={handleAddOrder}>
            <AddressSelector
              addresses={addresses}
              onSelect={(name) => setSelectedOrderAddressName(name)}
              placeholder="📍 Válasszon meglévő címet vagy írjon be újat"
            />
            <select name="orderType" required>
              <option value="">Válassza ki a szállítási típust</option>
              <option value="black">⚫ Fekete</option>
              <option value="white">⚪ Fehér</option>
            </select>
            <input
              type="text"
              name="orderDetails"
              placeholder="Megrendelés részletei (opcionális)"
            />
            <input
              type="number"
              name="orderPrice"
              placeholder="Ár"
              step="0.01"
              min="0"
              required
            />
            <button type="submit" className="btn btn-primary">
              Megrendelés hozzáadása
            </button>
          </form>

          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Megrendelések keresése cím alapján..."
              value={orderSearchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrderSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${orderTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setOrderTypeFilter('all')}
            >
              Összes
            </button>
            <button
              className={`filter-btn ${orderTypeFilter === 'black' ? 'active' : ''}`}
              onClick={() => setOrderTypeFilter('black')}
            >
              ⚫ Fekete
            </button>
            <button
              className={`filter-btn ${orderTypeFilter === 'white' ? 'active' : ''}`}
              onClick={() => setOrderTypeFilter('white')}
            >
              ⚪ Fehér
            </button>
          </div>

          <div className="list">
            {filteredOrders.length === 0 ? (
              <div className="empty">
                {orders.length === 0
                  ? 'Még nincsenek megrendelések. Hozzáadhat egyet az elkezdéshez!'
                  : 'Nincsenek megrendelések az Ön kereséséhez'}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const badgeClass = order.type === 'black' ? 'badge-black' : 'badge-white'
                const icon = order.type === 'black' ? '⚫' : '⚪'
                return (
                  <div key={order.id} className="item">
                    <div className="item-content">
                      <div className="item-name">{order.addressName}</div>
                      <div className="item-detail">{order.details || 'Nincsenek részletek'}</div>
                      <span className={`item-badge ${badgeClass}`}>
                        {icon} {order.type === 'black' ? 'FEKETE' : 'FEHÉR'}
                      </span>
                      <div className="item-detail">💰 Ár: ${order.price.toFixed(2)}</div>
                      <div className="item-detail">Hozzáadva: {order.timestamp}</div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {orders.length > 0 && (
            <button className="btn btn-danger" style={{ marginTop: '20px', width: '100%' }} onClick={handleClearOrders}>
              Az összes megrendelés törlése
            </button>
          )}
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="tab-content">
          <h2>Elszámolás</h2>
          <div className="settlement-list">
            {orders.length === 0 ? (
              <div className="empty">Nincs megrendelés az elszámoláshoz</div>
            ) : (
              <>
                <div className="settlement-orders">
                  {orders.map((order) => (
                    <div key={order.id} className="settlement-item">
                      <label className="settlement-label">
                        <input
                          type="checkbox"
                          checked={checkedOrders.has(order.id)}
                          onChange={() => handleCheckOrder(order.id)}
                        />
                        <span className="settlement-order-info">
                          <span className="order-address">{order.addressName}</span>
                          <span className="order-type-badge">
                            {order.type === 'black' ? '⚫ Fekete' : '⚪ Fehér'}
                          </span>
                          <span className="order-price">${order.price.toFixed(2)}</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="settlement-totals">
                  <div className="total-card">
                    <h3>Kiválasztott megrendelések: {getSettlementTotals().count}</h3>
                  </div>

                  <div className="totals-grid">
                    <div className="total-box total-all">
                      <div className="total-label">Összes</div>
                      <div className="total-amount">${getSettlementTotals().totalAll.toFixed(2)}</div>
                    </div>

                    <div className="total-box total-black">
                      <div className="total-label">⚫ Fekete</div>
                      <div className="total-amount">${getSettlementTotals().totalBlack.toFixed(2)}</div>
                    </div>

                    <div className="total-box total-white">
                      <div className="total-label">⚪ Fehér</div>
                      <div className="total-amount">${getSettlementTotals().totalWhite.toFixed(2)}</div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ marginTop: '20px', width: '100%' }}
                    onClick={() => setCheckedOrders(new Set())}
                  >
                    Összes kijelölés törlése
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
