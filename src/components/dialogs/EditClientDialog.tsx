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
import { useUpdateClient, type Client } from "@/hooks/useClients";
import { Loader2 } from "lucide-react";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function EditClientDialog({
  open,
  onOpenChange,
  client,
}: EditClientDialogProps) {
  const { toast } = useToast();
  const updateClient = useUpdateClient();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    source: "",
    email: "",
    phone: "",
    notes: "",
    status: "medium",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        company: client.company || "",
        source: client.source || "",
        email: client.email || "",
        phone: client.phone || "",
        notes: client.notes || "",
        status: client.status || "medium",
      });
    }
  }, [client, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!client) return;

    try {
      // Only update notes
      await updateClient.mutateAsync({
        id: client.id,
        notes: formData.notes || null,
      });

      toast({
        title: "Notes updated",
        description: `Notes for ${client.name} have been updated successfully.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Client Notes</DialogTitle>
          <DialogDescription>
            Update notes for <span className="font-medium text-foreground">{client.name}</span>. Only notes can be edited.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5">
            {/* Read-only fields */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                readOnly
                className="bg-muted/50 cursor-not-allowed border-border/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-company" className="text-sm font-medium">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                readOnly
                className="bg-muted/50 cursor-not-allowed border-border/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-source" className="text-sm font-medium">Source</Label>
              <Input
                id="edit-source"
                value={formData.source}
                readOnly
                className="bg-muted/50 cursor-not-allowed border-border/40 capitalize"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ""}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed border-border/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ""}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed border-border/40"
                />
              </div>
            </div>

            {/* Editable notes field */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add notes about this client..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={6}
                className="border-border/60 focus:border-primary/50 transition-colors resize-none"
              />
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
            <Button type="submit" disabled={updateClient.isPending} className="shadow-sm hover:shadow-md transition-all">
              {updateClient.isPending && (
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


