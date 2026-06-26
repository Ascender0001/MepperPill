import { useState, useEffect, ChangeEvent } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/ManagerDashboard.css'
import { IconSearch, IconMoney, IconDotBlack, IconDotWhite, IconX } from './icons'

interface Profile {
  id: string
  email: string
  full_name: string
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

interface ManagerDashboardProps {
  userProfile: Profile
}

export function ManagerDashboard({ userProfile }: ManagerDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [drivers, setDrivers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'settlement'>('orders')
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set())
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)

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
      if (!error) { setOrders([]); setCheckedOrders(new Set()) }
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.addressname.toLowerCase().includes(orderSearchTerm.toLowerCase())
    const matchesType = orderTypeFilter === 'all' || order.type === orderTypeFilter
    return matchesSearch && matchesType
  })

  const filteredSettlementOrders = orders.filter((order) => {
    const term = settlementSearchTerm.toLowerCase()
    return order.addressname.toLowerCase().includes(term) || (order.details || '').toLowerCase().includes(term)
  })

  const handleCheckOrder = (orderId: number) => {
    const newChecked = new Set(checkedOrders)
    if (newChecked.has(orderId)) newChecked.delete(orderId)
    else newChecked.add(orderId)
    setCheckedOrders(newChecked)
  }

  const getSettlementTotals = () => {
    const checked = orders.filter((o) => checkedOrders.has(o.id))
    return {
      totalAll: checked.reduce((s, o) => s + o.price, 0),
      totalBlack: checked.filter((o) => o.type === 'black').reduce((s, o) => s + o.price, 0),
      totalWhite: checked.filter((o) => o.type === 'white').reduce((s, o) => s + o.price, 0),
      count: checked.length,
    }
  }

  const formatRsd = (value: number) =>
    new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Nincs hozzárendelve'
    const driver = drivers.find((d) => d.id === driverId)
    return driver ? driver.full_name || driver.email : 'Ismeretlen'
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
                      <div className="item-name">{order.addressname}</div>
                      <div className="item-detail">{order.details || 'Nincsenek részletek'}</div>
                      <span className={`item-badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {order.type === 'black' ? <IconDotBlack size={10} /> : <IconDotWhite size={10} />}
                        {order.type === 'black' ? 'FEKETE' : 'FEHÉR'}
                      </span>
                      <div className="item-detail" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconMoney size={14} /> Ár: {formatRsd(order.price)}</div>
                      <div className="item-detail">Hozzáadva: {order.timestamp}</div>
                      <div className="item-detail">Futár: {getDriverName(order.driver_id)}</div>

                      <div className="order-actions-row">
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
                      </div>
                    </div>
                    <div className="item-actions">
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
            {orders.length === 0 ? (
              <div className="empty">Nincs megrendelés az elszámoláshoz</div>
            ) : (
              <>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Keresés az elszámolásban..."
                    value={settlementSearchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettlementSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="settlement-orders">
                  {filteredSettlementOrders.map((order) => (
                    <div key={order.id} className="settlement-item" onClick={() => setSelectedOrderDetails(order)}>
                      <label className="settlement-label">
                        <input
                          type="checkbox"
                          checked={checkedOrders.has(order.id)}
                          onChange={() => handleCheckOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="settlement-order-info">
                          <span className="order-address">{order.addressname}</span>
                          <span className="order-type-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {order.type === 'black' ? <IconDotBlack size={8} /> : <IconDotWhite size={8} />}
                            {order.type === 'black' ? 'Fekete' : 'Fehér'}
                          </span>
                          <span className="order-price">{formatRsd(order.price)}</span>
                          <span className="order-timestamp">{order.timestamp}</span>
                          <span className="order-driver">{getDriverName(order.driver_id)}</span>
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
                      <div className="total-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconDotBlack size={10} /> Fekete</div>
                      <div className="total-amount">{formatRsd(getSettlementTotals().totalBlack)}</div>
                    </div>
                    <div className="total-box total-white">
                      <div className="total-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconDotWhite size={10} /> Fehér</div>
                      <div className="total-amount">{formatRsd(getSettlementTotals().totalWhite)}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }} onClick={() => setCheckedOrders(new Set())}>
                    Összes kijelölés törlése
                  </button>
                </div>
              </>
            )}
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
