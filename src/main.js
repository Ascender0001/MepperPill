import './style.css'

// App state
const state = {
  addresses: [],
  orders: [],
  searchQuery: '',
}

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem('deliveryAppData')
  if (saved) {
    const data = JSON.parse(saved)
    state.addresses = data.addresses || []
    state.orders = data.orders || []
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('deliveryAppData', JSON.stringify(state))
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const tab = e.target.dataset.tab
    
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'))
    
    e.target.classList.add('active')
    document.getElementById(tab).classList.add('active')
  })
})

// Address search
document.getElementById('addressSearch').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.toLowerCase()
  renderAddresses()
})

// Address management
document.getElementById('addressForm').addEventListener('submit', (e) => {
  e.preventDefault()
  
  const name = document.getElementById('addressName').value.trim()
  const address = document.getElementById('addressValue').value.trim()
  
  if (name && address) {
    state.addresses.push({ id: Date.now(), name, address })
    saveData()
    e.target.reset()
    document.getElementById('addressSearch').value = ''
    state.searchQuery = ''
    renderAddresses()
    updateAddressSelect()
  }
})

function renderAddresses() {
  const list = document.getElementById('addressList')
  
  if (state.addresses.length === 0) {
    list.innerHTML = '<div class="empty">No addresses saved yet</div>'
    return
  }
  
  const filtered = state.addresses.filter(
    (addr) =>
      addr.name.toLowerCase().includes(state.searchQuery) ||
      addr.address.toLowerCase().includes(state.searchQuery)
  )
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">No addresses match your search</div>'
    return
  }
  
  list.innerHTML = filtered.map((addr) => `
    <div class="item">
      <div class="item-content">
        <div class="item-name">${addr.name}</div>
        <div class="item-detail">${addr.address}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-danger btn-small" onclick="deleteAddress(${addr.id})">Delete</button>
      </div>
    </div>
  `).join('')
}

// Order management
document.getElementById('orderForm').addEventListener('submit', (e) => {
  e.preventDefault()
  
  const addressId = document.getElementById('orderAddress').value
  const type = document.getElementById('orderType').value
  const details = document.getElementById('orderDetails').value.trim()
  const price = parseFloat(document.getElementById('orderPrice').value)
  
  if (addressId && type && price >= 0) {
    const address = state.addresses.find((a) => a.id == addressId)
    if (address) {
      state.orders.push({
        id: Date.now(),
        addressId: parseInt(addressId),
        addressName: address.name,
        type,
        details,
        price,
        timestamp: new Date().toLocaleTimeString(),
      })
      saveData()
      e.target.reset()
      renderOrders()
    }
  }
})

function renderOrders() {
  const list = document.getElementById('orderList')
  
  if (state.orders.length === 0) {
    list.innerHTML = '<div class="empty">No orders yet. Add one to get started!</div>'
    return
  }
  
  list.innerHTML = state.orders.map((order) => {
    const badgeClass = order.type === 'black' ? 'badge-black' : 'badge-white'
    const icon = order.type === 'black' ? '⚫' : '⚪'
    return `
      <div class="item">
        <div class="item-content">
          <div class="item-name">${order.addressName}</div>
          <div class="item-detail">${order.details || 'No details'}</div>
          <span class="item-badge ${badgeClass}">${icon} ${order.type.toUpperCase()}</span>
          <div class="item-detail">💰 Price: $${order.price.toFixed(2)}</div>
          <div class="item-detail">Added: ${order.timestamp}</div>
        </div>
        <div class="item-actions">
          <button class="btn btn-danger btn-small" onclick="deleteOrder(${order.id})">Delete</button>
        </div>
      </div>
    `
  }).join('')
}

function updateAddressSelect() {
  const select = document.getElementById('orderAddress')
  const currentValue = select.value
  
  select.innerHTML = '<option value="">Select address</option>' + state.addresses.map((addr) => `
    <option value="${addr.id}">${addr.name}</option>
  `).join('')
  
  if (currentValue) select.value = currentValue
}

// Delete functions
window.deleteAddress = function (id) {
  state.addresses = state.addresses.filter((a) => a.id !== id)
  state.orders = state.orders.filter((o) => o.addressId !== id)
  saveData()
  renderAddresses()
  updateAddressSelect()
  renderOrders()
}

window.deleteOrder = function (id) {
  state.orders = state.orders.filter((o) => o.id !== id)
  saveData()
  renderOrders()
}

// Clear all orders
document.getElementById('clearOrders').addEventListener('click', () => {
  if (state.orders.length > 0 && confirm('Are you sure you want to delete all orders?')) {
    state.orders = []
    saveData()
    renderOrders()
  }
})

// Initialize app
loadData()
renderAddresses()
updateAddressSelect()
renderOrders()

