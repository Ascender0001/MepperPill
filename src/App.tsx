import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { AddressSelector } from './components/AddressSelector'
import { DeliveryTypeSelect } from './components/DeliveryTypeSelect'
import { supabase } from './supabaseClient'
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
  details: string | null
  price: number
  timestamp: string
}

function App() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'settlement'>('orders')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set())
  const [selectedOrderAddressName, setSelectedOrderAddressName] = useState('')
  const [selectedOrderType, setSelectedOrderType] = useState<'black' | 'white'>('black')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .select('*')
        .order('id', { ascending: true })

      if (addressError) {
        console.error('Supabase addresses error:', addressError)
      } else {
        setAddresses((addressData || []) as Address[])
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: true })

      if (orderError) {
        console.error('Supabase orders error:', orderError)
      } else {
        setOrders((orderData || []) as Order[])
      }
    }

    void loadData()
  }, [])

  const handleAddOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const addressName = selectedOrderAddressName.trim()
    const type = selectedOrderType
    const details = (form.elements.namedItem('orderDetails') as HTMLInputElement).value.trim()
    const price = parseFloat((form.elements.namedItem('orderPrice') as HTMLInputElement).value)

    if (!addressName) {
      alert('Válasszon egy címet!')
      return
    }

    if (!type) {
      alert('Válasszon szállítási típust!')
      return
    }

    if (isNaN(price) || price < 0) {
      alert('Adjon meg érvényes árat!')
      return
    }

    try {
      let address = addresses.find((a) => a.name.toLowerCase() === addressName.toLowerCase())

      if (!address) {
        const newAddress: Address = {
          id: Date.now(),
          name: addressName,
          address: addressName,
        }
        const { data: insertedAddress, error: addressError } = await supabase
          .from('addresses')
          .insert(newAddress)
          .select()
          .single()

        if (addressError) {
          console.error('Supabase insert address error:', addressError)
          alert('Hiba a cím mentésekor: ' + addressError.message)
          return
        }

        address = insertedAddress as Address
        setAddresses((prev) => [...prev, address])
      }

      if (address) {
        const now = new Date()
        const date = now.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        const time = now.toLocaleTimeString('hu-HU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        const newOrder: Order = {
          id: Date.now(),
          addressId: address.id,
          addressName: address.name,
          type,
          details: details || null,
          price,
          timestamp: `${date} ${time}`,
        }

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert(newOrder)
          .select()
          .single()

        if (orderError) {
          console.error('Supabase insert order error:', orderError)
          alert('Hiba a megrendelés mentésekor: ' + orderError.message)
          return
        }

        setOrders((prev) => [...prev, (insertedOrder as Order)])
        form.reset()
        setSelectedOrderAddressName('')
        alert('Megrendelés sikeresen mentve!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('Hiba történt: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'))
    }
  }

  const handleDeleteOrder = async (id: number) => {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) {
      console.error('Supabase delete order error:', error)
      return
    }
    const newOrders = orders.filter((o) => o.id !== id)
    setOrders(newOrders)
  }

  const handleClearOrders = async () => {
    if (orders.length > 0 && confirm('Biztosan szeretné törölni az összes megrendelést?')) {
      const { error } = await supabase.from('orders').delete().gt('id', 0)
      if (error) {
        console.error('Supabase clear orders error:', error)
        return
      }
      setOrders([])
      setCheckedOrders(new Set())
    }
  }

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = order.addressName.toLowerCase().includes(orderSearchTerm.toLowerCase())
    const matchesType = orderTypeFilter === 'all' || order.type === orderTypeFilter
    return matchesSearch && matchesType
  })

  const filteredSettlementOrders = orders.filter((order: Order) => {
    const term = settlementSearchTerm.toLowerCase()
    const matchesAddress = order.addressName.toLowerCase().includes(term)
    const matchesDetails = (order.details || '').toLowerCase().includes(term)
    return matchesAddress || matchesDetails
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

  const formatRsd = (value: number) =>
    new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrderDetails(order)
  }

  const handleCloseOrderDetails = () => {
    setSelectedOrderDetails(null)
  }

  return (
    <div className="container">
      <h1>🍕 Mepper Pill</h1>

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
            <DeliveryTypeSelect 
              value={selectedOrderType}
              onSelect={(type) => setSelectedOrderType(type)}
            />
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
                      <div className="item-detail">💰 Ár: {formatRsd(order.price)}</div>
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
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="🔍 Keresés az elszámolásban (cím, részletek)..."
                    value={settlementSearchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettlementSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="settlement-orders">
                  {filteredSettlementOrders.map((order) => (
                    <div
                      key={order.id}
                      className="settlement-item"
                      onClick={() => handleOpenOrderDetails(order)}
                    >
                      <label className="settlement-label">
                        <input
                          type="checkbox"
                          checked={checkedOrders.has(order.id)}
                          onChange={() => handleCheckOrder(order.id)}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <span className="settlement-order-info">
                          <span className="order-address">{order.addressName}</span>
                          <span className="order-type-badge">
                            {order.type === 'black' ? '⚫ Fekete' : '⚪ Fehér'}
                          </span>
                          <span className="order-price">{formatRsd(order.price)}</span>
                          <span className="order-timestamp">{order.timestamp}</span>
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
                      <div className="total-amount">{formatRsd(getSettlementTotals().totalAll)}</div>
                    </div>

                    <div className="total-box total-black">
                      <div className="total-label">⚫ Fekete</div>
                      <div className="total-amount">{formatRsd(getSettlementTotals().totalBlack)}</div>
                    </div>

                    <div className="total-box total-white">
                      <div className="total-label">⚪ Fehér</div>
                      <div className="total-amount">{formatRsd(getSettlementTotals().totalWhite)}</div>
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

      {selectedOrderDetails && (
        <div className="modal-overlay" onClick={handleCloseOrderDetails}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Megrendelés részletei</h3>
              <button className="modal-close" onClick={handleCloseOrderDetails}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <span className="modal-label">Cím</span>
                <span className="modal-value">{selectedOrderDetails.addressName}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Típus</span>
                <span className="modal-value">
                  {selectedOrderDetails.type === 'black' ? '⚫ Fekete' : '⚪ Fehér'}
                </span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Részletek</span>
                <span className="modal-value">{selectedOrderDetails.details || 'Nincsenek részletek'}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Ár</span>
                <span className="modal-value">{formatRsd(selectedOrderDetails.price)}</span>
              </div>
              <div className="modal-row">
                <span className="modal-label">Időpont</span>
                <span className="modal-value">{selectedOrderDetails.timestamp}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
