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
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeleteDeal, type Deal } from "@/hooks/useDeals";
import { EditDealDialog } from "./EditDealDialog";
import { format } from "date-fns";

interface DealDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
}

export function DealDetailDialog({
  open,
  onOpenChange,
  deal,
}: DealDetailDialogProps) {
  const { toast } = useToast();
  const deleteDeal = useDeleteDeal();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!deal) return null;

  const dealClient = (deal as any).clients;

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast({
        title: "Deal deleted",
        description: `${deal.title} has been deleted successfully.`,
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal",
        variant: "destructive",
      });
    }
  };

  const stageColors: Record<string, string> = {
    New: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/50",
    Contacted: "bg-primary/10 text-primary border-primary/50",
    "Follow-up": "bg-warning/10 text-warning border-warning/50",
    Negotiating: "bg-success/10 text-success border-success/50",
    Closed: "bg-success/10 text-success border-success/50",
  };

  const priorityColors: Record<string, string> = {
    high: "border-destructive/50 text-destructive bg-destructive/10",
    medium: "border-warning/50 text-warning bg-warning/10",
    low: "border-muted-foreground/50 text-muted-foreground",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{deal.title}</DialogTitle>
            <DialogDescription>
              Deal details and information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Basic Information</h3>
              <div className="grid gap-4 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</p>
                    <p className="font-bold text-foreground text-lg mt-0.5">
                      ${(deal.amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {dealClient && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
                      <p className="font-semibold text-foreground mt-0.5">
                        {dealClient.name || "—"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Stage</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize font-medium px-2.5 py-1",
                        stageColors[deal.stage] || stageColors.New
                      )}
                    >
                      {deal.stage}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {format(new Date(deal.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            {deal.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                <div className="p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {deal.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/60">
              <Button
                variant="outline"
                className="flex-1 gap-2 transition-all hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Edit Deal
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2 shadow-sm hover:shadow-md transition-all"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deal Dialog */}
      <EditDealDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        deal={deal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{deal.title}</strong> and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDeal.isPending}
            >
              {deleteDeal.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

