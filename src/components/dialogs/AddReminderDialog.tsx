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
import { useCreateReminder } from "@/hooks/useReminders";
import { Phone, Mail, Video, Clock, Loader2 } from "lucide-react";

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const reminderTypes = [
  { value: "call", label: "Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: Video },
  { value: "follow-up", label: "Follow-up", icon: Clock },
];

export function AddReminderDialog({ open, onOpenChange }: AddReminderDialogProps) {
  const { toast } = useToast();
  const { data: clients = [] } = useClients();
  const createReminder = useCreateReminder();
  const [formData, setFormData] = useState({
    title: "",
    clientId: "",
    type: "",
    priority: "medium",
    dueDate: "",
    dueTime: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type || !formData.dueDate || !formData.dueTime) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Title, Type, Date and Time.",
        variant: "destructive",
      });
      return;
    }

    try {
      const selectedClient = clients.find(c => c.id === formData.clientId);
      
      await createReminder.mutateAsync({
        title: formData.title,
        description: formData.notes || null,
        due_date: formData.dueDate,
        due_time: formData.dueTime,
        priority: formData.priority,
        type: formData.type,
        related_to: selectedClient?.name || null,
        completed: false,
      });

      toast({
        title: "Reminder created",
        description: `Reminder "${formData.title}" has been added.`,
      });

      setFormData({
        title: "",
        clientId: "",
        type: "",
        priority: "medium",
        dueDate: "",
        dueTime: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Reminder</DialogTitle>
          <DialogDescription>
            Set a reminder for a client follow-up. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Reminder Title *</Label>
              <Input
                id="title"
                placeholder="Follow-up call with client"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Reminder Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium">Client</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Choose a client (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `- ${client.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-medium">Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime" className="text-sm font-medium">Time *</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="border-border/60 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for this reminder..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="border-border/60 focus:border-primary/50 transition-colors resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="transition-all">
              Cancel
            </Button>
            <Button type="submit" disabled={createReminder.isPending} className="shadow-sm hover:shadow-md transition-all">
              {createReminder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
