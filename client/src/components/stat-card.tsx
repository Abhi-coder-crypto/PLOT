import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, gradient = "from-primary to-primary/80", delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden hover-elevate">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.2, type: "spring" }}
                className="text-3xl font-bold text-foreground mt-2"
              >
                {value}
              </motion.p>
              {trend && (
                <p className={`text-xs mt-2 ${trend.isPositive ? "text-chart-3" : "text-destructive"}`}>
                  {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
                </p>
              )}
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
