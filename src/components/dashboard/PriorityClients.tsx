import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export function PriorityClients() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: deals = [] } = useDeals();

  // Get deals count per client and sort by priority (status)
  const priorityClients = useMemo(() => {
    return clients
      .map((client) => {
        const clientDeals = deals.filter((deal: any) => {
          const dealClientId = deal.client_id || deal.clients?.id;
          return String(dealClientId) === String(client.id);
        });
        return {
          ...client,
          deals: clientDeals.length,
          priority: client.status || "medium",
        };
      })
      .sort((a, b) => {
        // Sort by priority: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
        if (bPriority !== aPriority) return bPriority - aPriority;
        // If same priority, sort by number of deals
        return b.deals - a.deals;
      })
      .slice(0, 5); // Show top 5
  }, [clients, deals]);

  const handleClientClick = (clientId: string) => {
    navigate("/clients");
  };

  if (clientsLoading) {
    return (
      <div className="rounded-xl bg-card border border-border/60 p-6 shadow-card animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (priorityClients.length === 0) {
    return (
      <div className="rounded-xl bg-card border border-border/60 p-6 shadow-card animate-slide-up hover:shadow-elevated transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">AI Priority Clients</h3>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Sorted by priority</span>
        </div>
        <div className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No clients yet. Add your first client to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border/60 p-6 shadow-card animate-slide-up hover:shadow-elevated transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">AI Priority Clients</h3>
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Sorted by priority</span>
      </div>
      <div className="space-y-3">
        {priorityClients.map((client, index) => (
          <div
            key={client.id}
            onClick={() => handleClientClick(client.id)}
            className="group flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-all duration-200 cursor-pointer hover:shadow-sm animate-fade-in hover-lift"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm shadow-sm transition-transform duration-200 group-hover:scale-110">
              {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground truncate">{client.company || "—"}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {client.notes ? (
                  <span className="italic">{client.notes.length > 50 ? `${client.notes.substring(0, 50)}...` : client.notes}</span>
                ) : (
                  <span className="text-muted-foreground/60">No description</span>
                )}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{client.deals} {client.deals === 1 ? "deal" : "deals"}</p>
              <p className="text-xs text-muted-foreground capitalize">{client.source || "—"}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs capitalize font-medium px-2.5 py-1",
                client.priority === "high" && "border-destructive/50 text-destructive bg-destructive/10",
                client.priority === "medium" && "border-warning/50 text-warning bg-warning/10",
                client.priority === "low" && "border-muted-foreground/50 text-muted-foreground bg-muted/30"
              )}
            >
              {client.priority}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
