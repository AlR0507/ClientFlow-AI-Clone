import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  Plus,
  DollarSign,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeals } from "@/hooks/useDeals";
import { useDeleteClient, type Client } from "@/hooks/useClients";
import { AddDealDialog } from "./AddDealDialog";
import { EditClientDialog } from "./EditClientDialog";
import { format } from "date-fns";

interface ClientDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ClientDetailDialog({
  open,
  onOpenChange,
  client,
}: ClientDetailDialogProps) {
  const { toast } = useToast();
  const { data: deals = [] } = useDeals();
  const deleteClient = useDeleteClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDealDialogOpen, setAddDealDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!client) return null;

  // Filter deals for this client
  const clientDeals = deals.filter((deal: any) => {
    // Handle different possible structures
    const dealClientId = deal.client_id || deal.clients?.id || (deal as any).clients?.client_id;
    // Also check if client.id matches (handling both string and number IDs)
    return String(dealClientId) === String(client.id);
  });

  const handleDelete = async () => {
    try {
      await deleteClient.mutateAsync(client.id);
      toast({
        title: "Client deleted",
        description: `${client.name} has been deleted successfully.`,
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{client.name}</DialogTitle>
            <DialogDescription>
              Client details and associated deals
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Basic Information</h3>
              <div className="grid gap-4 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {client.company || "—"}
                    </p>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-foreground mt-0.5">{client.email}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="font-semibold text-foreground mt-0.5">{client.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</p>
                    <p className="font-semibold text-foreground capitalize mt-0.5">
                      {client.source || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Status</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize font-medium px-2.5 py-1",
                        client.status === "high" &&
                          "border-destructive/50 text-destructive bg-destructive/10",
                        client.status === "medium" &&
                          "border-warning/50 text-warning bg-warning/10",
                        client.status === "low" &&
                          "border-muted-foreground/50 text-muted-foreground bg-muted/30"
                      )}
                    >
                      {client.status || "medium"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                    {client.notes ? (
                      <p className="text-sm text-foreground whitespace-pre-wrap bg-card p-4 rounded-lg border border-border/60 min-h-[100px] leading-relaxed">
                        {client.notes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic bg-card p-4 rounded-lg border border-border/60 min-h-[100px] flex items-center">
                        No notes available
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {format(new Date(client.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Deals Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Deals ({clientDeals.length})
                </h3>
                <Button
                  size="sm"
                  className="gap-2 shadow-sm hover:shadow-md transition-all"
                  onClick={() => setAddDealDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create Deal
                </Button>
              </div>

              {clientDeals.length === 0 ? (
                <div className="p-12 text-center rounded-xl border-2 border-dashed border-border/60 bg-secondary/20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <DollarSign className="h-8 w-8 text-primary/50" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">
                        No deals assigned
                      </p>
                      <p className="text-sm text-muted-foreground mb-5">
                        Create a deal to start tracking opportunities with this client
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 transition-all hover:bg-primary/10 hover:border-primary/30"
                        onClick={() => setAddDealDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Create First Deal
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      className="p-5 rounded-xl border border-border/60 bg-card hover:bg-secondary/50 hover:shadow-sm transition-all duration-200 hover-lift"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-2 text-base">
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                              <DollarSign className="h-4 w-4 text-primary" />
                              ${deal.amount?.toLocaleString() || "0"}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize font-medium px-2.5 py-1"
                            >
                              {deal.stage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                className="flex-1 gap-2 transition-all hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Client
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2 shadow-sm hover:shadow-md transition-all"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={client}
      />

      {/* Add Deal Dialog */}
      <AddDealDialog
        open={addDealDialogOpen}
        onOpenChange={setAddDealDialogOpen}
        defaultClientId={client.id}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{client.name}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

