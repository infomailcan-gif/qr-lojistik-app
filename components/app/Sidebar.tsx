"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Layers, Truck, ShieldCheck, Crown, Hexagon, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { UserRole } from "@/lib/auth";

interface SidebarProps {
  userRole: UserRole;
}

const navItems = [
  {
    name: "Ana Sayfa",
    href: "/app",
    icon: Home,
    roles: ["user", "manager", "super_admin"],
    color: "from-blue-500 to-indigo-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["manager", "super_admin"],
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
  {
    name: "Koliler",
    href: "/app/boxes",
    icon: Package,
    roles: ["user", "manager", "super_admin"],
    color: "from-sky-500 to-blue-500",
    bgColor: "bg-sky-50",
    textColor: "text-sky-600",
  },
  {
    name: "Paletler",
    href: "/app/pallets",
    icon: Layers,
    roles: ["user", "manager", "super_admin"],
    color: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-600",
  },
  {
    name: "Sevkiyatlar",
    href: "/app/shipments",
    icon: Truck,
    roles: ["user", "manager", "super_admin"],
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  {
    name: "Raporlar",
    href: "/app/admin",
    icon: ShieldCheck,
    roles: ["manager", "super_admin"],
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
  },
  {
    name: "Süper Admin",
    href: "/app/super-admin",
    icon: Crown,
    roles: ["super_admin"],
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 border-r border-slate-200/60 bg-white/60 backdrop-blur-xl">
      {/* Tech Pattern Background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <pattern id="sidebarGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sidebarGrid)" />
        </svg>
      </div>

      <nav className="flex flex-col gap-2 p-4 w-full relative z-10">
        {/* Nav Header */}
        <div className="mb-4 px-3">
          <motion.div 
            className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Hexagon className="h-3 w-3" />
            <span>Navigasyon</span>
          </motion.div>
        </div>

        {filteredItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group",
                  isActive
                    ? `${item.bgColor} ${item.textColor}`
                    : "text-slate-600 hover:bg-slate-100/80"
                )}
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-gradient-to-b",
                      item.color
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Icon Container */}
                <motion.div
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isActive 
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg` 
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                  )}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>

                {/* Text */}
                <span className={cn(
                  "font-medium transition-colors",
                  isActive ? item.textColor : "text-slate-600 group-hover:text-slate-800"
                )}>
                  {item.name}
                </span>

                {/* Hover Glow */}
                {isActive && (
                  <motion.div
                    className={cn(
                      "absolute inset-0 rounded-xl opacity-20 bg-gradient-to-r blur-sm -z-10",
                      item.color
                    )}
                    animate={{
                      opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {/* Bottom Decoration */}
        <div className="mt-auto pt-4 border-t border-slate-200/60">
          <motion.div 
            className="flex items-center justify-center gap-1.5 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </nav>
    </aside>
  );
}
