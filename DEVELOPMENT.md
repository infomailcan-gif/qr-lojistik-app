# Development Guide

## 🎯 Project Structure

```
qr-lojistik/
├── app/
│   ├── (auth)/          # Authentication pages (login)
│   ├── (app)/           # Protected app pages
│   │   └── app/
│   │       ├── layout.tsx      # App shell with nav & footer
│   │       ├── page.tsx        # Dashboard
│   │       ├── boxes/          # Box management
│   │       ├── pallets/        # Pallet management
│   │       ├── shipments/      # Shipment tracking
│   │       └── admin/          # Admin panel (manager only)
│   ├── globals.css      # Global styles
│   └── layout.tsx       # Root layout
├── components/
│   ├── app/             # App-specific components
│   │   ├── AnimatedBackground.tsx
│   │   ├── BottomNav.tsx       # Mobile bottom navigation
│   │   ├── Sidebar.tsx         # Desktop sidebar navigation
│   │   └── TopBar.tsx          # Top bar with user menu
│   └── ui/              # Reusable UI components (shadcn/ui)
├── lib/
│   ├── auth.ts          # Unified auth interface (Supabase + mock)
│   ├── supabase/
│   │   └── client.ts    # Supabase client configuration
│   └── utils.ts         # Utility functions
└── middleware.ts        # Route protection middleware
```

## 🔐 Authentication System

The app supports two authentication modes:

### 1. Mock Authentication (Default)
- Automatically enabled when Supabase credentials are not provided
- Perfect for UI development and testing
- No backend required

**How it works:**
- User enters name and selects role (User/Manager)
- Session stored in localStorage
- Client-side only validation

### 2. Supabase Authentication
- Enabled when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Full email/password authentication
- Role stored in `user_metadata.role`

**Setup:**
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Main actions, links
- **Cyan**: (#06b6d4) - Pallets
- **Purple**: (#a855f7) - Shipments
- **Green**: (#22c55e) - Success states
- **Amber**: (#f59e0b) - Admin/warnings

### Components
All UI components are in `components/ui/` and follow shadcn/ui patterns:
- **Button**: Primary actions with variants
- **Card**: Glassmorphism containers
- **Input**: Form inputs with focus states
- **Select**: Dropdowns with animations
- **Badge**: Status indicators
- **Skeleton**: Loading states

### Animations
Powered by Framer Motion:
- Page transitions: `initial/animate` pattern
- Staggered lists: `variants` with `staggerChildren`
- Micro-interactions: `whileHover/whileTap`
- Layout animations: `layoutId` for smooth transitions

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

### Navigation
- **Mobile (< md)**: Bottom navigation bar
- **Desktop (≥ md)**: Left sidebar navigation

### Touch Targets
- Minimum 44px height for mobile buttons
- Active scale animations for feedback

## 🚀 Development Workflow

### Start Development Server
```bash
npm run dev
# Opens at http://localhost:3000
```

### Check Types
```bash
npm run type-check
```

### Lint Code
```bash
npm run lint
```

### Build for Production
```bash
npm run build
npm start
```

## 🔄 Adding New Pages

1. Create page in `app/(app)/app/[page-name]/page.tsx`
2. Add route to navigation arrays in `BottomNav.tsx` and `Sidebar.tsx`
3. Set role permissions in the `roles` array
4. Use animations for consistency:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  {/* Your content */}
</motion.div>
```

## 🎯 Role-Based Access

Two roles supported:
- **user**: Access to Dashboard, Boxes, Pallets, Shipments
- **manager**: All user pages + Admin panel

**Implementation:**
1. Route array includes `roles: ["user", "manager"]`
2. Navigation components filter by user role
3. Admin page checks role on mount and redirects if not manager

## 🎨 Theme Customization

Theme is defined in:
- `tailwind.config.js`: Color system, spacing, animations
- `app/globals.css`: CSS variables for colors

To customize colors, edit CSS variables in `globals.css`:
```css
:root {
  --primary: 217.2 91.2% 59.8%;  /* HSL values */
  /* ... */
}
```

## 📦 Adding New Components

### Utility Components (shadcn/ui style)
```bash
# Create in components/ui/
# Follow existing patterns
# Use cn() for className merging
# Add variants with class-variance-authority
```

### App Components
```bash
# Create in components/app/
# Use "use client" for interactive components
# Follow mobile-first approach
# Add animations for polish
```

## 🐛 Debugging Tips

1. **Check terminal output**: Build errors and warnings appear there
2. **Browser console**: Client-side errors and logs
3. **Network tab**: API calls and response data
4. **React DevTools**: Component hierarchy and props
5. **Mock auth**: Test different roles by changing selection

## 📝 Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for components
- **Exports**: Named exports for components
- **Props**: Define interfaces for component props
- **Client components**: Add `"use client"` directive when needed

## 🎯 Next Steps (Future Phases)

This is Phase 1 (Skeleton). Future phases will add:
- QR code scanning functionality
- Box/Pallet/Shipment CRUD operations
- Database integration (Supabase tables)
- Real-time updates
- Advanced filtering and search
- Analytics and reporting
- Print labels and QR codes

## 💡 Tips

1. **Use mock auth** for UI development - no backend needed
2. **Test both roles** to ensure proper access control
3. **Check mobile view** - it's the primary target
4. **Use animations sparingly** - performance matters
5. **Keep components small** - easier to maintain

## 🆘 Common Issues

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Dependencies out of sync
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails
```bash
# Check types first
npm run type-check

# Then try build
npm run build
```

---

**Developer**: Canberk Şıklı
**Tech Stack**: Next.js 14 + TypeScript + TailwindCSS + Framer Motion




