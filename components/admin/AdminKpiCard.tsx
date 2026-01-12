import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface AdminKpiCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  color?: "blue" | "cyan" | "purple" | "green" | "amber";
  index?: number;
}

const colorClasses = {
  blue: {
    bg: "from-blue-50 to-indigo-50",
    gradient: "from-blue-500 to-indigo-600",
    text: "text-blue-600",
    glow: "shadow-blue-500/20",
  },
  cyan: {
    bg: "from-cyan-50 to-teal-50",
    gradient: "from-cyan-500 to-teal-600",
    text: "text-cyan-600",
    glow: "shadow-cyan-500/20",
  },
  purple: {
    bg: "from-purple-50 to-pink-50",
    gradient: "from-purple-500 to-pink-600",
    text: "text-purple-600",
    glow: "shadow-purple-500/20",
  },
  green: {
    bg: "from-emerald-50 to-teal-50",
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-600",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    bg: "from-amber-50 to-orange-50",
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-600",
    glow: "shadow-amber-500/20",
  },
};

export function AdminKpiCard({
  title,
  value,
  icon: Icon,
  subtitle,
  color = "blue",
  index = 0,
}: AdminKpiCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${colors.bg} shadow-lg ${colors.glow}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full -translate-y-8 translate-x-8" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">{title}</p>
              <motion.p 
                className="text-3xl font-bold text-slate-800"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 + index * 0.05 }}
              >
                {typeof value === 'number' ? value.toLocaleString("tr-TR") : value}
              </motion.p>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            <motion.div
              className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}
              whileHover={{ scale: 1.1, rotate: 10 }}
            >
              <Icon className="h-6 w-6 text-white" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
