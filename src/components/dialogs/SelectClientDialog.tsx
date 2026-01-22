import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, type Client } from "@/hooks/useClients";
import { Search, Building2, Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SelectClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (client: Client) => void;
}

export function SelectClientDialog({
  open,
  onOpenChange,
  onSelect,
}: SelectClientDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: clients = [], isLoading } = useClients();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (client: Client) => {
    onSelect(client);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Client</DialogTitle>
          <DialogDescription>
            Choose a client to automate their prioritization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search client by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-border/60 focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Clients List */}
          <div className="max-h-[450px] overflow-y-auto space-y-2 scrollbar-thin">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">No clients found</p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery ? "Try adjusting your search" : "No clients available"}
                  </p>
                </div>
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelect(client)}
                  className="w-full text-left p-4 rounded-xl border border-border/60 hover:bg-secondary/70 hover:border-primary/30 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm shadow-sm transition-transform duration-200 group-hover:scale-110">
                      {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {client.company && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-primary/60" />
                            <span className="truncate max-w-[150px]">{client.company}</span>
                          </span>
                        )}
                        {client.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-primary/60" />
                            <span className="truncate max-w-[150px]">{client.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/60">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="transition-all">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

