import { useState, useEffect, ChangeEvent } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ManagerDashboard.css'
import { IconMoney, IconDotBlack, IconDotWhite, IconX } from './icons'

interface Profile {
  id: string
  email: string
  full_name: string
  phone_num: string | null
  role: string
}

interface Order {
  id: number
  addressid: number
  addressname: string
  type: 'black' | 'white'
  details: string | null
  price: number
  timestamp: string
  driver_id: string | null
}

interface TempEntry {
  id: number
  price: number
}

export function ManagerDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'settlement'>('orders')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')

  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
  const [orderSort, setOrderSort] = useState<'none' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('none')

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)
  const [confirmChange, setConfirmChange] = useState<{ orderId: number; newType: 'black' | 'white' } | null>(null)
  const [tempEntries, setTempEntries] = useState<TempEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('tempDriverEntries') || '[]') as TempEntry[] }
    catch { return [] }
  })
  const [tempNextId, setTempNextId] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('tempDriverNextId') || '-1') as number }
    catch { return -1 }
  })
  const [tempPriceInput, setTempPriceInput] = useState('')
  const [dailyRevenue, setDailyRevenue] = useState(() => {
    try { return localStorage.getItem('dailyRevenue') || '' }
    catch { return '' }
  })
  const [dailyRevenueInput, setDailyRevenueInput] = useState('')

  useEffect(() => {
    localStorage.setItem('tempDriverEntries', JSON.stringify(tempEntries))
  }, [tempEntries])

  useEffect(() => {
    localStorage.setItem('tempDriverNextId', JSON.stringify(tempNextId))
  }, [tempNextId])

  useEffect(() => {
    localStorage.setItem('dailyRevenue', dailyRevenue)
  }, [dailyRevenue])

  useEffect(() => {
    const loadData = async () => {
      const [orderRes, driverRes] = await Promise.all([
        supabase.from('orders').select('*').order('id', { ascending: true }),
        supabase.from('profiles').select('*').eq('role', 'driver').order('full_name', { ascending: true }),
      ])

      if (!orderRes.error) setOrders((orderRes.data || []) as Order[])
      if (!driverRes.error) setDrivers((driverRes.data || []) as Profile[])
    }
    void loadData()
  }, [])

  const handleDeleteOrder = async (id: number) => {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(orders.filter((o) => o.id !== id))
  }

  const handleClearOrders = async () => {
    if (orders.length > 0 && confirm('Biztosan szeretné törölni az összes megrendelést?')) {
      const { error } = await supabase.from('orders').delete().gt('id', 0)
      if (!error) { setOrders([]) }
    }
  }

  const handleAssignDriver = async (orderId: number, driverId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId || null })
      .eq('id', orderId)
    if (!error) {
      setOrders(orders.map((o) =>
        o.id === orderId ? { ...o, driver_id: driverId || null } : o
      ))
    }
  }

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch = order.addressname.toLowerCase().includes(orderSearchTerm.toLowerCase())
      const matchesType = orderTypeFilter === 'all' || order.type === orderTypeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (orderSort === 'name-asc') return a.addressname.localeCompare(b.addressname)
      if (orderSort === 'name-desc') return b.addressname.localeCompare(a.addressname)
      if (orderSort === 'price-asc') return a.price - b.price
      if (orderSort === 'price-desc') return b.price - a.price
      return 0
    })

  const driverSettlementTotals = drivers
    .map((d) => ({
      id: d.id,
      name: d.full_name || d.email,
      total: orders.filter((o) => o.driver_id === d.id).reduce((s, o) => s + o.price, 0),
    }))
    .filter((d) => d.total > 0)

  const unassignedTotal = orders.filter((o) => !o.driver_id).reduce((s, o) => s + o.price, 0)

  const tempTotal = tempEntries.reduce((s, e) => s + e.price, 0)

  const grandTotal =
    driverSettlementTotals.reduce((s, d) => s + d.total, 0) + unassignedTotal + tempTotal

  const formatRsd = (value: number) =>
    new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Nincs hozzárendelve'
    const driver = drivers.find((d) => d.id === driverId)
    return driver ? driver.full_name || driver.email : 'Ismeretlen'
  }

  const addTempEntry = () => {
    const price = Number(tempPriceInput.replace(',', '.'))
    if (isNaN(price) || price <= 0) return
    setTempEntries([...tempEntries, { id: tempNextId, price }])
    setTempNextId(tempNextId - 1)
    setTempPriceInput('')
  }

  const handleChangeType = async (orderId: number, newType: 'black' | 'white') => {
    const { error } = await supabase.from('orders').update({ type: newType }).eq('id', orderId)
    if (!error) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, type: newType } : o)))
    }
    setConfirmChange(null)
  }

  const removeTempEntry = (id: number) => {
    setTempEntries(tempEntries.filter((e) => e.id !== id))
  }

  const getDriverOrderStats = (driverId: string) => {
    const driverOrders = orders.filter((o) => o.driver_id === driverId)
    return {
      total: driverOrders.length,
      totalRevenue: driverOrders.reduce((s, o) => s + o.price, 0),
    }
  }

  return (
    <div>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Megrendelések
        </button>
        <button className={`tab-btn ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>
          Futárok
        </button>
        <button className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`} onClick={() => setActiveTab('settlement')}>
          Elszámolás
        </button>
      </div>

      {activeTab === 'orders' && (
        <div className="tab-content">
          <h2>Mai Megrendelések</h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Megrendelések keresése cím alapján..."
              value={orderSearchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrderSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button className={`filter-btn ${orderTypeFilter === 'all' ? 'active' : ''}`} onClick={() => setOrderTypeFilter('all')}>Összes</button>
            <button className={`filter-btn ${orderTypeFilter === 'black' ? 'active' : ''}`} onClick={() => setOrderTypeFilter('black')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><IconDotBlack size={10} /> Fekete</button>
            <button className={`filter-btn ${orderTypeFilter === 'white' ? 'active' : ''}`} onClick={() => setOrderTypeFilter('white')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}><IconDotWhite size={10} /> Fehér</button>
          </div>
          <div className="filter-buttons">
            <button className={`filter-btn ${orderSort === 'none' ? 'active' : ''}`} onClick={() => setOrderSort('none')}>Alap</button>
            <button className={`filter-btn ${orderSort === 'name-asc' ? 'active' : ''}`} onClick={() => setOrderSort('name-asc')}>A–Z</button>
            <button className={`filter-btn ${orderSort === 'name-desc' ? 'active' : ''}`} onClick={() => setOrderSort('name-desc')}>Z–A</button>
            <button className={`filter-btn ${orderSort === 'price-asc' ? 'active' : ''}`} onClick={() => setOrderSort('price-asc')}>Ár ↑</button>
            <button className={`filter-btn ${orderSort === 'price-desc' ? 'active' : ''}`} onClick={() => setOrderSort('price-desc')}>Ár ↓</button>
          </div>

          <div className="list">
            {filteredOrders.length === 0 ? (
              <div className="empty">
                {orders.length === 0 ? 'Még nincsenek megrendelések.' : 'Nincsenek megrendelések a szűréshez.'}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const badgeClass = order.type === 'black' ? 'badge-black' : 'badge-white'
                return (
                  <div key={order.id} className="item">
                    <div className="item-content">
                      <div className="item-header">
                        <div className="item-name">{order.addressname}</div>
                        <span className={`item-badge ${badgeClass}`} onClick={() => setConfirmChange({ orderId: order.id, newType: order.type === 'black' ? 'white' : 'black' })}>
                          {order.type === 'black' ? <IconDotBlack size={8} /> : <IconDotWhite size={8} />}
                          {order.type === 'black' ? 'Fekete' : 'Fehér'}
                        </span>
                      </div>
                      <div className="item-detail">{order.details || 'Nincsenek részletek'}</div>
                      <div className="item-meta">
                        <span className="item-detail"><IconMoney size={12} /> {formatRsd(order.price)}</span>
                        <span className="item-detail">Hozzáadva: {order.timestamp}</span>
                        <span className="item-detail">Futár: {getDriverName(order.driver_id)}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <select
                        value={order.driver_id || ''}
                        onChange={(e) => handleAssignDriver(order.id, e.target.value)}
                        className="inline-select"
                      >
                        <option value="">-- Futár --</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>{d.full_name || d.email}</option>
                        ))}
                      </select>
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteOrder(order.id)}>Törlés</button>
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

      {activeTab === 'drivers' && (
        <div className="tab-content">
          <h2>Futárok</h2>
          {drivers.length === 0 ? (
            <div className="empty">Nincsenek regisztrált futárok.</div>
          ) : (
            <div className="driver-list">
              {drivers.map((driver) => {
                const stats = getDriverOrderStats(driver.id)
                return (
                  <div key={driver.id} className="driver-card">
                    <div className="driver-info">
                      <div className="driver-name">🚗 {driver.full_name || 'Névtelen'}</div>
                      <div className="driver-email">{driver.email}</div>
                    </div>
                    <div className="driver-stats">
                      <div className="stat-item">
                        <span className="stat-label">Összes rendelés</span>
                        <span className="stat-value">{stats.total}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Bevétel</span>
                        <span className="stat-value">{formatRsd(stats.totalRevenue)}</span>
                      </div>
                    </div>
                    <div className="driver-orders">
                      <h4>Rendelések</h4>
                      {orders.filter((o) => o.driver_id === driver.id).length === 0 ? (
                        <div className="empty-small">Nincs rendelés</div>
                      ) : (
                        orders
                          .filter((o) => o.driver_id === driver.id)
                          .map((order) => (
                            <div key={order.id} className="mini-order">
                              <span className="mini-order-address">{order.addressname}</span>
                              <span className="mini-order-price">{formatRsd(order.price)}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="tab-content">
          <h2>Elszámolás</h2>
          <div className="settlement-list">
            <div className="temp-driver-input">
              <input
                type="text"
                placeholder="Ideiglenes futár összeg..."
                value={tempPriceInput}
                onChange={(e) => setTempPriceInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTempEntry() }}
                className="search-input"
              />
              <button className="btn btn-primary btn-small" onClick={addTempEntry}>Hozzáadás</button>
            </div>

            <div className="settlement-orders">
              {driverSettlementTotals.length === 0 && unassignedTotal === 0 && tempEntries.length === 0 ? (
                <div className="empty">Nincs megrendelés az elszámoláshoz</div>
              ) : (
                <>
                  {driverSettlementTotals.map((d) => (
                    <div key={d.id} className="settlement-item">
                      <span className="settlement-order-info">
                        <span className="order-driver">{d.name}</span>
                        <span className="order-price">{formatRsd(d.total)}</span>
                      </span>
                    </div>
                  ))}
                  {unassignedTotal > 0 && (
                    <div className="settlement-item">
                      <span className="settlement-order-info">
                        <span className="order-driver">Nincs hozzárendelve</span>
                        <span className="order-price">{formatRsd(unassignedTotal)}</span>
                      </span>
                    </div>
                  )}
                  {tempEntries.map((entry) => (
                    <div key={entry.id} className="settlement-item settlement-item-temp">
                      <span className="settlement-order-info">
                        <span className="order-driver">Ideiglenes futár</span>
                        <span className="order-price">{formatRsd(entry.price)}</span>
                      </span>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => removeTempEntry(entry.id)}
                      >Törlés</button>
                    </div>
                  ))}
                </>
              )}
            </div>

            <h2 style={{ marginBottom: 8 }}>Napi bevétel</h2>

            <div className="daily-revenue-input">
              <input
                type="text"
                placeholder="Összeg..."
                value={dailyRevenueInput}
                onChange={(e) => setDailyRevenueInput(e.target.value)}
                className="search-input"
              />
              <button
                className="btn"
                onClick={() => { setDailyRevenue(dailyRevenueInput); setDailyRevenueInput('') }}
                style={{ background: 'var(--green)', color: '#000', fontWeight: 900, border: 'none', padding: '8px 20px', borderRadius: 'var(--radius)', fontSize: 13, minHeight: 36 }}
              >Frissítés</button>
            </div>

            <div className="settlement-totals">
              <div className="totals-grid">
                <div className="total-box total-all">
                  <div className="total-label">Összes bevétel</div>
                  <div className="total-amount">{formatRsd(grandTotal)}</div>
                </div>
                <div className="total-box total-all">
                  <div className="total-label">Napi bevétel</div>
                  <div className="total-amount">{dailyRevenue || '—'}</div>
                </div>
              </div>
            </div>

            {(() => {
              const target = Number(dailyRevenue.replace(',', '.'))
              if (!dailyRevenue || isNaN(target)) return null
              const diff = grandTotal - target
              const absDiff = Math.abs(diff)
              const isEqual = Math.abs(diff) < 0.01
              const isMissing = diff < 0
              return (
                <div className={`revenue-status ${isEqual ? 'ok' : isMissing ? 'missing' : 'more'}`}>
                  {isEqual ? (
                    <div className="revenue-status-text">✓✓ Rendben</div>
                  ) : isMissing ? (
                    <div className="revenue-status-text">Hiányzik {formatRsd(absDiff)}</div>
                  ) : (
                    <div className="revenue-status-text">Többlet {formatRsd(absDiff)}</div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {confirmChange && (
        <div className="confirm-overlay" onClick={() => setConfirmChange(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Típus módosítása</div>
            <div className="confirm-text">
              Biztosan szeretné módosítani a rendelés típusát<br />
              <strong>{confirmChange.newType === 'black' ? 'Feketére' : 'Fehérre'}</strong>?
            </div>
            <div className="confirm-actions">
              <button className="btn btn-danger btn-small" onClick={() => setConfirmChange(null)}>Mégse</button>
              <button className="btn btn-primary btn-small" onClick={() => handleChangeType(confirmChange.orderId, confirmChange.newType)}>Módosítás</button>
            </div>
          </div>
        </div>
      )}

      {selectedOrderDetails && (
        <div className="modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Megrendelés részletei</h3>
              <button className="modal-close" onClick={() => setSelectedOrderDetails(null)}><IconX size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="modal-row"><span className="modal-label">Cím</span><span className="modal-value">{selectedOrderDetails.addressname}</span></div>
              <div className="modal-row"><span className="modal-label">Típus</span><span className="modal-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {selectedOrderDetails.type === 'black' ? <IconDotBlack size={10} /> : <IconDotWhite size={10} />}
                {selectedOrderDetails.type === 'black' ? 'Fekete' : 'Fehér'}
              </span></div>
              <div className="modal-row"><span className="modal-label">Részletek</span><span className="modal-value">{selectedOrderDetails.details || 'Nincsenek részletek'}</span></div>
              <div className="modal-row"><span className="modal-label">Ár</span><span className="modal-value">{formatRsd(selectedOrderDetails.price)}</span></div>
              <div className="modal-row"><span className="modal-label">Időpont</span><span className="modal-value">{selectedOrderDetails.timestamp}</span></div>
              <div className="modal-row"><span className="modal-label">Futár</span><span className="modal-value">{getDriverName(selectedOrderDetails.driver_id)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
