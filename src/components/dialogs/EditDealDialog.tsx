import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUpdateDeal, type Deal } from "@/hooks/useDeals";
import { useClients } from "@/hooks/useClients";
import { Loader2 } from "lucide-react";

interface EditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
}

export function EditDealDialog({
  open,
  onOpenChange,
  deal,
}: EditDealDialogProps) {
  const { toast } = useToast();
  const updateDeal = useUpdateDeal();
  const { data: clients = [] } = useClients();
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    amount: "",
    stage: "New",
    priority: "medium",
    description: "",
  });

  useEffect(() => {
    if (deal && open) {
      setFormData({
        clientId: deal.client_id ? String(deal.client_id) : "__none__",
        title: deal.title || "",
        amount: deal.amount?.toString() || "",
        stage: deal.stage || "New",
        priority: deal.priority || "medium",
        description: deal.description || "",
      });
    }
  }, [deal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deal) return;

    if (!formData.title || !formData.amount) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Deal Name and Deal Amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const numericAmount = parseFloat(formData.amount.replace(/[$,]/g, "")) || 0;

      await updateDeal.mutateAsync({
        id: deal.id,
        title: formData.title,
        amount: numericAmount,
        client_id: formData.clientId && formData.clientId !== "__none__" ? formData.clientId : null,
        stage: formData.stage,
        priority: formData.priority,
        description: formData.description || null,
      });

      toast({
        title: "Deal updated",
        description: `${formData.title} has been updated successfully.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal",
        variant: "destructive",
      });
    }
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Deal</DialogTitle>
          <DialogDescription>
            Update deal information. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="edit-deal-client" className="text-sm font-medium">Select Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => {
                  setFormData({ ...formData, clientId: value });
                }}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No client</SelectItem>
                  {clients.map((client) => {
                    const clientId = client.id || (client as any).client_id;
                    return (
                      <SelectItem key={clientId} value={String(clientId)}>
                        {client.name} {client.company && `- ${client.company}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deal-title" className="text-sm font-medium">Deal Name *</Label>
              <Input
                id="edit-deal-title"
                placeholder="Enterprise License"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deal-amount" className="text-sm font-medium">Deal Amount *</Label>
              <Input
                id="edit-deal-amount"
                placeholder="10000"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-deal-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-deal-description"
                placeholder="Add details about this deal..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="border-border/60 focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-deal-stage" className="text-sm font-medium">Stage *</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, stage: value })
                  }
                >
                  <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Negotiating">Negotiating</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateDeal.isPending} className="shadow-sm hover:shadow-md transition-all">
              {updateDeal.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

