# QR Lojistik - Modern Logistics Management System

A modern, mobile-first logistics management web application built with Next.js, TypeScript, and cutting-edge UI technologies.

## ⚡ Quick Start

**Want to get started immediately?** See **[QUICKSTART.md](./QUICKSTART.md)** for a 2-minute setup guide!

```bash
npm install
npm run dev
# Open http://localhost:3000 and log in with any name!
```

## 🚀 Features

- **Modern UI**: Dark theme with glassmorphism effects and smooth animations
- **Mobile-First**: Optimized for mobile devices with bottom navigation
- **Authentication**: Flexible auth system (Supabase or mock for development)
- **Role-Based Access**: User and Manager roles with appropriate permissions
- **Responsive Design**: Beautiful on all screen sizes
- **Smooth Animations**: Powered by Framer Motion

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Auth**: Supabase (with mock fallback for dev)

## 📚 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)**: Comprehensive development guide
  - Project structure
  - Authentication system details
  - Design system documentation
  - Development workflow
  - Adding new pages and components
  - Troubleshooting

## 🛠️ Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Configuration

For production with Supabase, create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Development Mode**: If you don't provide Supabase credentials, the app will automatically use **mock authentication**. This means:
- No Supabase setup required
- Enter any name and select a role to log in
- Perfect for UI development and testing
- Authenticated session stored in localStorage

### Development

```bash
# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Pages

- `/login` - Authentication page (mock or Supabase)
- `/app` - Dashboard with statistics and quick actions
- `/app/boxes` - Box management (placeholder)
- `/app/pallets` - Pallet management (placeholder)
- `/app/shipments` - Shipment tracking (placeholder)
- `/app/admin` - Admin panel (manager only)

## 🔐 Authentication

### Mock Mode (Development)
When Supabase credentials are not configured, you can log in by:
1. Entering any name
2. Selecting a role (User or Manager)

### Supabase Mode (Production)
When configured, uses Supabase Auth with email/password.

## 🎨 Design System

- **Colors**: Dark theme with blue/cyan accents
- **Typography**: Inter font family
- **Spacing**: Consistent 4px grid system
- **Animations**: Subtle, performant transitions
- **Touch Targets**: Minimum 44px for mobile

## 👨‍💻 Developer

Coded by Canberk Şıklı

## 📄 License

Private project

