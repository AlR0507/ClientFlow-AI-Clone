import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon }: StatsCardProps) {
  return (
    <div className="group rounded-xl bg-card border border-border/60 p-6 shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in hover-lift hover:border-primary/20 relative overflow-hidden">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs font-medium inline-flex items-center gap-1",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md ml-4 flex-shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
