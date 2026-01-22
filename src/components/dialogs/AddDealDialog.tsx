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
import { useClients } from "@/hooks/useClients";
import { useCreateDeal } from "@/hooks/useDeals";
import { Loader2 } from "lucide-react";

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStage?: string;
  defaultClientId?: string;
}

export function AddDealDialog({ open, onOpenChange, defaultStage = "New", defaultClientId }: AddDealDialogProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const createDeal = useCreateDeal();
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    amount: "",
    description: "",
  });

  // Set default client ID when dialog opens
  useEffect(() => {
    if (open && defaultClientId) {
      setFormData(prev => ({ ...prev, clientId: defaultClientId }));
    } else if (open && !defaultClientId) {
      setFormData(prev => ({ ...prev, clientId: "" }));
    }
  }, [open, defaultClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      console.log("Creating deal with data:", {
        title: formData.title,
        amount: numericAmount,
        client_id: formData.clientId || null,
        stage: defaultStage,
        priority: "medium",
      });
      
      const result = await createDeal.mutateAsync({
        title: formData.title,
        amount: numericAmount,
        client_id: formData.clientId || null,
        stage: defaultStage,
        priority: "medium",
        description: formData.description || null,
      });

      console.log("Deal created successfully:", result);

      toast({
        title: "Deal created",
        description: `"${formData.title}" has been added to ${defaultStage} stage.`,
      });

      setFormData({
        clientId: "",
        title: "",
        amount: "",
        description: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating deal:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Deal</DialogTitle>
          <DialogDescription>
            Create a new deal. It will be added to the <span className="font-medium text-foreground">"{defaultStage}"</span> stage. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">Select Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => {
                  console.log("Client selected:", value);
                  setFormData({ ...formData, clientId: value });
                }}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                  ) : (
                    clients.map((client) => {
                      const clientId = client.id || (client as any).client_id;
                      console.log("Client in select:", client, "ID:", clientId);
                      return (
                        <SelectItem key={clientId} value={clientId}>
                          {client.name} {client.company && `- ${client.company}`}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Deal Name *</Label>
              <Input
                id="title"
                placeholder="Enterprise License"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">Deal Amount *</Label>
              <Input
                id="amount"
                placeholder="10000"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                placeholder="Add details about this deal..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="border-border/60 focus:border-primary/50 transition-colors resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="transition-all">
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending} className="shadow-sm hover:shadow-md transition-all">
              {createDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
