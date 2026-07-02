# 🍕 Mepper Pill

Delivery management app with auth, role-based dashboards, and Supabase backend.

Built with **React**, **TypeScript**, **Vite**, and **Supabase**.

---

## Features

- **Auth** — Email/password login and registration with role selection (driver / manager)
- **Manager Dashboard** — View all orders, assign drivers, settlement calculations with search and filters
- **Driver Dashboard** — Create orders with address autocomplete, track personal orders, settlement view
- **Address Autocomplete** — Search existing addresses or create new ones on the fly
- **Delivery Types** — Support for *fekete* (black) and *fehér* (white) delivery categories
- **Settlement** — Select orders and view totals broken down by type
- **Hungarian UI** — Full Magyar language interface

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build | Vite 7 |
| Backend | Supabase (auth, database, RLS) |
| Styling | Custom CSS (dark theme) |
| Database | PostgreSQL via Supabase |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Ascender0001/MepperPill.git
   cd MepperPill
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run database migration**
   Open the Supabase SQL Editor and run `supabase_migration.sql` to create the tables and set up Row Level Security.

4. **Start developing**
   ```bash
   npm run dev
   ```

### Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Project Structure

```
src/
├── App.tsx                      # Root component with auth + role routing
├── main.tsx                     # Entry point
├── supabaseClient.ts            # Supabase client setup
├── vite-env.d.ts                # Vite type declarations
├── style.css                    # Global styles
├── components/
│   ├── AuthPage.tsx             # Login / register form
│   ├── ManagerDashboard.tsx     # Manager: orders, drivers, settlement
│   ├── DriverDashboard.tsx      # Driver: create orders, settlement
│   ├── AddressSelector.tsx      # Searchable address dropdown
│   ├── DeliveryTypeSelect.tsx   # Black/white type picker
│   └── SearchDropdown.tsx       # Generic searchable select
└── styles/                      # Per-component CSS files
```

---

## Database

The Supabase migration (`supabase_migration.sql`) creates:

- **`profiles`** — One row per `auth.users` entry, includes `role` (`driver` | `manager`)
- **`orders`** — Delivery orders with address, type, price, and driver assignment
- **`addresses`** — Delivery addresses

Row Level Security ensures managers see all data while drivers only see their own orders.

---

## Design

Dark terminal aesthetic with neon red/orange accents. Monospace typography. The UI is optimized for quick order entry and settlement review.

---

## License

MIT
