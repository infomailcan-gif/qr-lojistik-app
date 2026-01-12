"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Layers, Truck, ShieldCheck, Crown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { UserRole } from "@/lib/auth";

interface BottomNavProps {
  userRole: UserRole;
}

const navItems = [
  {
    name: "Ana Sayfa",
    shortName: "Ana",
    href: "/app",
    icon: Home,
    roles: ["user", "manager", "super_admin"],
    color: "from-blue-500 to-indigo-500",
    activeColor: "text-blue-600",
    activeBg: "bg-blue-50",
  },
  {
    name: "Dashboard",
    shortName: "Panel",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["manager", "super_admin"],
    color: "from-cyan-500 to-blue-500",
    activeColor: "text-cyan-600",
    activeBg: "bg-cyan-50",
  },
  {
    name: "Koliler",
    shortName: "Koli",
    href: "/app/boxes",
    icon: Package,
    roles: ["user", "manager", "super_admin"],
    color: "from-sky-500 to-blue-500",
    activeColor: "text-sky-600",
    activeBg: "bg-sky-50",
  },
  {
    name: "Paletler",
    shortName: "Palet",
    href: "/app/pallets",
    icon: Layers,
    roles: ["user", "manager", "super_admin"],
    color: "from-cyan-500 to-teal-500",
    activeColor: "text-cyan-600",
    activeBg: "bg-cyan-50",
  },
  {
    name: "Sevkiyatlar",
    shortName: "Sevk",
    href: "/app/shipments",
    icon: Truck,
    roles: ["user", "manager", "super_admin"],
    color: "from-purple-500 to-pink-500",
    activeColor: "text-purple-600",
    activeBg: "bg-purple-50",
  },
  {
    name: "Raporlar",
    shortName: "Rapor",
    href: "/app/admin",
    icon: ShieldCheck,
    roles: ["manager", "super_admin"],
    color: "from-emerald-500 to-teal-500",
    activeColor: "text-emerald-600",
    activeBg: "bg-emerald-50",
  },
  {
    name: "S. Admin",
    shortName: "Admin",
    href: "/app/super-admin",
    icon: Crown,
    roles: ["super_admin"],
    color: "from-amber-500 to-orange-500",
    activeColor: "text-amber-600",
    activeBg: "bg-amber-50",
  },
];

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/80 backdrop-blur-xl md:hidden">
      {/* Top Gradient Line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3), transparent)",
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="flex items-center justify-around px-1 py-1.5 safe-area-pb">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-xl"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all",
                  isActive && item.activeBg
                )}
                whileTap={{ scale: 0.9 }}
              >
                {/* Icon */}
                <motion.div
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    isActive 
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg`
                      : "text-slate-400"
                  )}
                  animate={isActive ? {
                    scale: [1, 1.1, 1],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? item.activeColor : "text-slate-400"
                  )}
                >
                  {item.shortName}
                </span>
              </motion.div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={cn(
                    "absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-gradient-to-r",
                    item.color
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
