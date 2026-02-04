```
██╗     ██╗  ██╗ ███████╗ ██████╗  ██████╗  █████╗ ██╗     
╚██╗   ██╔╝  ██║ ██╔════╝ ██╔════╝ ██╔════╝ ██╔══██╗██║     
 ╚██╗ ██╔╝   ██║ █████╗   ██║  ███╗██║  ███╗███████║██║     
  ╚████╔╝    ██║ ██╔══╝   ██║   ██║██║   ██║██╔══██║██║     
   ╚██╔╝     ██║ ███████╗ ╚██████╔╝╚██████╔╝██║  ██║███████╗
    ╚═╝      ╚═╝ ╚══════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚══════╝
                                                              
        ⚠️  MEPPER PILL - UNDERGROUND DELIVERY NETWORK  ⚠️
        For use by authorized personnel only
        Unauthorized access is a serious criminal offense
```

---

## 🔴 MEPPER PILL

A minimalistic, underground delivery tracking application built with **Vite**, **React**, and **TypeScript**. Designed for fast, efficient order management with a dark, mysterious aesthetic that matches its shadowy operations.

**Status:** Fully Operational | **Access Level:** CLASSIFIED | **Last Updated:** 2026

---

## 🎯 FEATURES

- **⚫ Order Management** - Track fekete (black) and fehér (white) delivery types
- **🏘️ Smart Address System** - Automatically creates delivery addresses on first use
- **📊 Settlement Calculations** - Separate totals for black orders, white orders, and combined totals
- **🔍 Search & Filter** - Find orders by address or delivery type in seconds
- **💾 Persistent Storage** - All operations saved locally (localStorage)
- **🎨 Dark Terminal Aesthetic** - Professional underground operation UI
- **📱 Responsive Design** - Works on any device, any situation
- **🇭🇺 Hungarian Language** - Full UI in Magyar

---

## ⚡ QUICK START

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A secure network connection

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ascender0001/bencefutar.git
   cd bencefutar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The app will launch at `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📋 USAGE GUIDE

### Main Workflow

1. **Add Orders Tab** (Megrendelések)
   - Select or create a new delivery address using the Address Selector
   - Choose delivery type: **⚫ Fekete** (Black) or **⚪ Fehér** (White)
   - Enter order details and price
   - Submit the order

2. **Settlement Tab** (Elszámolás)
   - Review all recorded orders
   - Select orders to settle (checkbox)
   - View automatic calculations:
     - **Total All** - Combined earnings
     - **Total Black** - Black delivery type earnings
     - **Total White** - White delivery type earnings
   - Filter by order type for quick verification

### Key Controls

| Action | Description |
|--------|-------------|
| 🔍 Search | Find orders by address name |
| 🎯 Filter | Sort by fekete/fehér delivery type |
| ✅ Checkbox | Mark orders as settled |
| 🗑️ Delete | Remove individual orders |
| 🧹 Clear All | Remove all records (confirmation required) |

---

## 🛠️ TECH STACK

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 7.3.1
- **Styling:** Custom CSS (Dark Theme)
- **State Management:** React Hooks (useState, useEffect)
- **Storage:** localStorage (deliveryAppData)
- **Font:** Courier New (monospace)
- **Colors:** Neon Red (#ff0033), Orange (#ff6b00), Green (#0f0)

---

## 📁 PROJECT STRUCTURE

```
bencefutar/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # React entry point
│   ├── style.css               # Global styles
│   ├── components/
│   │   ├── AddressSelector.tsx # Address dropdown + creation
│   │   └── SearchDropdown.tsx  # Reusable dropdown component
│   └── styles/
│       ├── AddressSelector.css
│       └── SearchDropdown.css
├── index.html                  # Entry HTML
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 💾 DATA STRUCTURE

### Address Object
```typescript
interface Address {
  id: number          // Unique timestamp-based ID
  name: string        // Address display name
  address: string     // Full address details
}
```

### Order Object
```typescript
interface Order {
  id: number                      // Unique timestamp-based ID
  addressId: number              // Reference to address
  addressName: string            // Address display name (denormalized)
  type: 'black' | 'white'       // Delivery type
  details: string                // Order notes/items
  price: number                  // Delivery price
  timestamp: string              // ISO datetime
}
```

---

## 🔧 AVAILABLE COMMANDS

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build locally
npm run preview

# Format code
npm run format
```

---

## 🎨 DESIGN SPECIFICATIONS

### Dark Underground Theme
- **Background:** Deep black with dark blue gradients (#0a0a0a → #16213e)
- **Primary:** Neon Red (#ff0033) - Danger/Warning
- **Secondary:** Neon Orange (#ff6b00) - Accent
- **Text:** Green Terminal (#0f0) for input fields
- **Borders:** Sharp edges, 2px solid red/orange
- **Effects:** Glowing shadows, neon glow

### Typography
- **Font:** Courier New (monospace)
- **Weight:** 900 (bold)
- **Case:** UPPERCASE for UI elements
- **Spacing:** Aggressive letter-spacing (1-3px)

---

## 📊 STATE MANAGEMENT

The application uses React hooks for state management:

```typescript
const [addresses, setAddresses] = useState<Address[]>([])
const [orders, setOrders] = useState<Order[]>([])
const [activeTab, setActiveTab] = useState<'orders' | 'settlement'>('orders')
const [checkedOrders, setCheckedOrders] = useState<Set<number>>(new Set())
const [orderSearchTerm, setOrderSearchTerm] = useState('')
const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'black' | 'white'>('all')
```

All data automatically persists to localStorage on changes.

---

## 🔐 SECURITY & PRIVACY

- **Local Storage Only:** All data stored client-side
- **No Server Communication:** Completely disconnected
- **Browser Cache:** Clear browser data to delete all records
- **No Tracking:** No analytics or external requests
- **Encrypted:** Use HTTPS in production
- **Classification Level:** RESTRICTED

---

## 🐛 TROUBLESHOOTING

### Orders not saving?
- Check browser localStorage is enabled
- Look in DevTools > Application > Storage > localStorage
- Data stored under key: `deliveryAppData`

### Dropdown not appearing?
- Ensure z-index isn't being overridden
- Check browser console for JavaScript errors
- Try refreshing the page

### Styling looks wrong?
- Clear browser cache (Ctrl+Shift+Delete)
- Rebuild with `npm run build`
- Check that all CSS files are imported

---

## 📝 DEVELOPMENT NOTES

### Adding New Features

1. Create components in `src/components/`
2. Add styles in `src/styles/` or inline
3. Update TypeScript interfaces as needed
4. Test with `npm run dev`
5. Build and verify: `npm run build`

### Code Style
- TypeScript strict mode enabled
- Functional components with hooks
- Descriptive variable names in Hungarian context
- Comments for complex logic

---

## 📄 LICENSE

**PROPRIETARY - FOR AUTHORIZED USE ONLY**

This software is provided as-is for delivery operations. Unauthorized distribution, modification, or reverse engineering is prohibited.

---

## 👤 AUTHOR

**Underground Development Team** | Mepper Pill Operations  
Contact through encrypted channels only.

---

## ⚠️ DISCLAIMER

This application is a delivery management tool designed for tracking shipments. Users are responsible for ensuring all activities comply with local laws and regulations. The developer assumes no liability for misuse.

```
STATUS: OPERATIONAL
LAST DEPLOYMENT: 2026-02-04
NEXT REVIEW: 2026-03-04
AUTHORIZATION: CLASSIFIED
```

---

**For operational questions:** `echo "Contact through secure channels"`
