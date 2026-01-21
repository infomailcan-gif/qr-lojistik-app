# Quick Start Guide

## ⚡ Get Up and Running in 2 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Navigate to: **http://localhost:3000**

## 🎮 Try It Out

### Login (Mock Mode - No Setup Needed!)
1. You'll be redirected to `/login`
2. Enter any name (e.g., "Ahmet")
3. Select role:
   - **User**: Access to Dashboard, Boxes, Pallets, Shipments
   - **Manager**: All pages + Admin panel
4. Click "Sign In"

### Explore the App
- **Dashboard**: View stats and recent activity
- **Boxes**: Box management interface (placeholder)
- **Pallets**: Pallet organization (placeholder)
- **Shipments**: Shipment tracking (placeholder)
- **Admin** (Manager only): Admin panel with tabs

### Mobile View
- Resize browser to < 768px width
- See bottom navigation in action
- Touch-friendly interface

## 🎨 What You're Seeing

- ✨ **Animated Background**: Subtle grid and floating orbs
- 🃏 **Glassmorphism Cards**: Transparent, blurred containers
- 🎭 **Smooth Animations**: Page transitions and micro-interactions
- 📱 **Mobile-First**: Bottom nav on mobile, sidebar on desktop
- 🌑 **Dark Theme**: Easy on the eyes, modern look

## 🔄 Switch Roles

To test different permissions:
1. Click logout (top-right)
2. Log in again with different role
3. Notice Admin tab appears/disappears

## 📸 What to Expect

### Login Page
- Hero card with animated entrance
- Dev mode badge (when Supabase not configured)
- Name input + role selector
- Smooth animations

### Dashboard
- Dynamic greeting based on time
- Stats cards with animated entrance
- Quick action buttons
- Recent activity feed

### List Pages (Boxes, Pallets, Shipments)
- Search bar and filters
- Empty states with CTAs
- Color-coded by type

### Admin Panel (Manager Only)
- Tabbed interface
- Dashboard/Departments/Users sections
- Placeholder for future features

## 🎯 Key Features to Notice

1. **Animations Everywhere**: Watch cards fade in, buttons scale on tap
2. **Mobile Navigation**: Bottom bar with active indicator
3. **Footer**: "Coded by Canberk Şıklı" on every protected page
4. **Role Protection**: Admin tab only for managers
5. **Empty States**: Beautiful placeholders for future features

## 🔧 Want to Use Supabase?

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Restart server. Now login uses real authentication!

## 📖 Need More Details?

- **Full Docs**: See [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Main README**: See [README.md](./README.md)

## 🚀 You're All Set!

The skeleton is ready. Future phases will add:
- QR code scanning
- Database operations
- Real data management
- More features!

---

**Happy Coding!** 🎉










