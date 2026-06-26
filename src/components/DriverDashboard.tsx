import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { supabase } from '../supabaseClient'
import { AddressSelector } from './AddressSelector'
import { DeliveryTypeSelect } from './DeliveryTypeSelect'
import { useToast } from './Toast'
import { IconSearch, IconDotBlack, IconDotWhite, IconMoney, IconPhone, IconLocation } from './icons'
import '../styles/DriverDashboard.css'

interface Address {
  id: number
  name: string
  address: string
  phone_num: string | null
}

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

interface DriverDashboardProps {
  userProfile: Profile
}

export function DriverDashboard({ userProfile }: DriverDashboardProps) {
  const { showToast } = useToast()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'settlement'>('orders')
  const [selectedOrderAddressName, setSelectedOrderAddressName] = useState('')
  const [orderPhoneNum, setOrderPhoneNum] = useState('')
  const [selectedOrderType, setSelectedOrderType] = useState<'black' | 'white'>('black')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('')
  const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set())
  const [expenses, setExpenses] = useState<Array<{ id: number; name: string; price: number }>>([])
  const [expenseName, setExpenseName] = useState('')
  const [expensePrice, setExpensePrice] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const [addressRes, orderRes] = await Promise.all([
        supabase.from('addresses').select('*').order('id', { ascending: true }),
        supabase.from('orders').select('*').eq('driver_id', userProfile.id).order('id', { ascending: false }),
      ])
      if (!addressRes.error) setAddresses((addressRes.data || []) as Address[])
      if (!orderRes.error) setOrders((orderRes.data || []) as Order[])
    }
    void loadData()
  }, [userProfile.id])

  const handleAddOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const addressName = selectedOrderAddressName.trim()
    const phoneNum = orderPhoneNum.trim()
    const type = selectedOrderType
    const details = (form.elements.namedItem('orderDetails') as HTMLInputElement).value.trim()
    const price = parseFloat((form.elements.namedItem('orderPrice') as HTMLInputElement).value)

    if (!addressName) { showToast('Válasszon egy címet!', 'error'); return }
    if (!type) { showToast('Válasszon szállítási típust!', 'error'); return }
    if (isNaN(price) || price < 0) { showToast('Adjon meg érvényes árat!', 'error'); return }

    try {
      let address = addresses.find((a) => a.name.toLowerCase() === addressName.toLowerCase())

      if (!address) {
        const newAddress: Address = {
          id: Date.now(),
          name: addressName,
          address: addressName,
          phone_num: phoneNum || null,
        }
        const { data: insertedAddress, error: addressError } = await supabase
          .from('addresses').insert(newAddress).select().single()
        if (addressError) { showToast('Hiba a cím mentésekor: ' + addressError.message, 'error'); return }
        address = insertedAddress as Address
        setAddresses((prev) => [...prev, address as Address])
      } else if (phoneNum && phoneNum !== (address.phone_num || '')) {
        const { data: updatedAddress, error: addressUpdateError } = await supabase
          .from('addresses')
          .update({ phone_num: phoneNum })
          .eq('id', address.id)
          .select()
          .single()
        if (addressUpdateError) { showToast('Hiba a telefonszám mentésekor: ' + addressUpdateError.message, 'error'); return }
        address = updatedAddress as Address
        setAddresses((prev) => prev.map((a) => (a.id === address!.id ? (address as Address) : a)))
      }

      if (address) {
        const now = new Date()
        const date = now.toLocaleDateString('hu-HU', { year: 'numeric', month: '2-digit', day: '2-digit' })
        const time = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const newOrder: Order = {
          id: Date.now(),
          addressid: address.id,
          addressname: address.name,
          type,
          details: details || null,
          price,
          timestamp: `${date} ${time}`,
          driver_id: userProfile.id,
        }

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders').insert(newOrder).select().single()
        if (orderError) { showToast('Hiba a megrendelés mentésekor: ' + orderError.message, 'error'); return }

        setOrders((prev) => [insertedOrder as Order, ...prev])
        form.reset()
        setSelectedOrderAddressName('')
        setOrderPhoneNum('')
        showToast('Megrendelés sikeresen mentve!')
      }
    } catch (error) {
      showToast('Hiba történt: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'), 'error')
    }
  }

  const handleDeleteOrder = async (id: number) => {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) setOrders(orders.filter((o) => o.id !== id))
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.addressname.toLowerCase().includes(orderSearchTerm.toLowerCase())
    const matchesType = orderTypeFilter === 'all' || order.type === orderTypeFilter
    return matchesSearch && matchesType
  })

  const formatRsd = (value: number) =>
    new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

  const todayRevenue = orders.reduce((s, o) => s + o.price, 0)

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

  const handleAddExpense = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = expenseName.trim()
    const price = parseFloat(expensePrice)
    if (!name || isNaN(price) || price < 0) return
    setExpenses((prev) => [...prev, { id: Date.now(), name, price }])
    setExpenseName('')
    setExpensePrice('')
  }

  const handleDeleteExpense = (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.price, 0)

  const getSettlementTotals = () => {
    const checked = orders.filter((o) => checkedOrders.has(o.id))
    return {
      totalAll: checked.reduce((s, o) => s + o.price, 0),
      totalBlack: checked.filter((o) => o.type === 'black').reduce((s, o) => s + o.price, 0),
      totalWhite: checked.filter((o) => o.type === 'white').reduce((s, o) => s + o.price, 0),
      count: checked.length,
    }
  }

  return (
    <div>
      <div className="driver-summary">
        <div className="summary-card">
          <div className="summary-label">Rendelések</div>
          <div className="summary-value">{orders.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Mai bevétel</div>
          <div className="summary-value">{formatRsd(todayRevenue)}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          Megrendelések
        </button>
        <button className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`} onClick={() => setActiveTab('settlement')}>
          Elszámolás
        </button>
      </div>

      {activeTab === 'orders' && (
      <div className="tab-content">
          <h2>Új Megrendelés</h2>
          <form onSubmit={handleAddOrder}>
            <AddressSelector
              addresses={addresses}
              onSelect={(name, id) => {
                setSelectedOrderAddressName(name)
                const selectedAddress = id ? addresses.find((a) => a.id === id) : undefined
                setOrderPhoneNum(selectedAddress?.phone_num || '')
              }}
                    placeholder="Válasszon meglévő címet vagy írjon be újat"
            />
            <input
              type="tel"
              name="orderPhoneNum"
              placeholder="Telefonszám (opcionális)"
              value={orderPhoneNum}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrderPhoneNum(e.target.value)}
            />
            <DeliveryTypeSelect value={selectedOrderType} onSelect={(type) => setSelectedOrderType(type)} />
            <input type="text" name="orderDetails" placeholder="Megrendelés részletei (opcionális)" />
            <input type="number" name="orderPrice" placeholder="Ár" step="0.01" min="0" required />
            <button type="submit" className="btn btn-primary">Megrendelés hozzáadása</button>
          </form>

          <h2 style={{ marginTop: '30px' }}>Mai Megrendelések</h2>
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
                {orders.length === 0 ? 'Még nincsenek megrendelések. Adjon hozzá egyet!' : 'Nincsenek megrendelések a szűréshez.'}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const badgeClass = order.type === 'black' ? 'badge-black' : 'badge-white'
                const orderAddress = addresses.find((a) => a.id === order.addressid)
                const phoneNum = orderAddress?.phone_num
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
                      {phoneNum && <div className="item-detail" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconPhone size={14} /> {phoneNum}</div>}
                    </div>
                    <div className="item-actions">
                      {phoneNum && (
                        <a href={`tel:${phoneNum}`} className="btn btn-phone btn-small"><IconPhone size={16} /></a>
                      )}
                      <button className="btn btn-danger btn-small" onClick={() => handleDeleteOrder(order.id)}>Törlés</button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
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

                  <div className="expenses-section">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconMoney size={18} /> Költségek</h3>
                    <form className="expense-form" onSubmit={handleAddExpense}>
                      <input
                        type="text"
                        placeholder="Költség neve"
                        value={expenseName}
                        onChange={(e) => setExpenseName(e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Összeg"
                        step="0.01"
                        min="0"
                        value={expensePrice}
                        onChange={(e) => setExpensePrice(e.target.value)}
                        required
                      />
                      <button type="submit" className="btn btn-primary btn-small">Hozzáadás</button>
                    </form>
                    {expenses.length > 0 && (
                      <div className="expense-list">
                        {expenses.map((exp) => (
                          <div key={exp.id} className="expense-item">
                            <span className="expense-name">{exp.name}</span>
                            <span className="expense-price">{formatRsd(exp.price)}</span>
                            <button className="btn btn-danger btn-small" onClick={() => handleDeleteExpense(exp.id)}><IconX size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {expenses.length === 0 && (
                      <div className="empty-small">Nincsenek költségek</div>
                    )}
                    <div className="expense-totals">
                      <div className="total-box total-all">
                        <div className="total-label">Bevétel összesen</div>
                        <div className="total-amount">{formatRsd(getSettlementTotals().totalAll)}</div>
                      </div>
                      <div className="total-box total-black">
                        <div className="total-label">⬜ Fekete - Költségek</div>
                        <div className="total-amount">{formatRsd(getSettlementTotals().totalBlack - totalExpenses)}</div>
                      </div>
                      <div className="total-box total-white">
                        <div className="total-label">⬜ Összes - Költségek</div>
                        <div className="total-amount">{formatRsd(getSettlementTotals().totalAll - totalExpenses)}</div>
                      </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
