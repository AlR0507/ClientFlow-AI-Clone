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
import { useCreateAutomation } from "@/hooks/useAutomations";
import { useExecuteAutomation } from "@/hooks/useExecuteAutomation";
import { useClients } from "@/hooks/useClients";
import { Mail, Clock, Calendar, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ActionType = "email" | "meeting" | "ai-summary";

const actionTypes: Array<{
  value: ActionType;
  label: string;
  icon: typeof Mail;
  description: string;
}> = [
  { value: "email", label: "Email", icon: Mail, description: "Send an automated email" },
  { value: "ai-summary", label: "AI Client Summary", icon: Zap, description: "Generate AI summary for a client" },
];

export function CreateAutomationDialog({ open, onOpenChange }: CreateAutomationDialogProps) {
  const { toast } = useToast();
  const createAutomation = useCreateAutomation();
  const executeAutomation = useExecuteAutomation();
  const { data: clients = [] } = useClients();
  const [actionType, setActionType] = useState<ActionType | "">("");
  
  // Form data for different action types
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    // Email fields
    emailMessage: "",
    emailSendDate: "",
    // Meeting follow-up fields
    meetingName: "",
    meetingEmailContent: "",
    // AI Client Summary fields
    selectedClientId: "",
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setActionType("");
      setFormData({
        name: "",
        description: "",
        emailMessage: "",
        emailSendDate: "",
        meetingName: "",
        meetingEmailContent: "",
        selectedClientId: "",
      });
    }
  }, [open]);

  const validateForm = (): boolean => {
    if (!formData.name || !actionType) {
      toast({
        title: "Required fields missing",
        description: "Please fill in Automation Name and Action.",
        variant: "destructive",
      });
      return false;
    }

    // Validate action-specific required fields
    switch (actionType) {
      case "email":
        if (!formData.emailMessage || !formData.emailSendDate || !formData.selectedClientId) {
          toast({
            title: "Required fields missing",
            description: "Please fill in Custom message, Date of sending, and select a client for Email action.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "meeting":
        if (!formData.meetingName || !formData.meetingEmailContent || !formData.selectedClientId) {
          toast({
            title: "Required fields missing",
            description: "Please fill in Meeting name, Email content, and select a client for Meeting follow-up.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "ai-summary":
        if (!formData.selectedClientId) {
          toast({
            title: "Required fields missing",
            description: "Please select a client for AI Client Summary.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Build config object based on action type
      const config: Record<string, any> = {};
      
      if (actionType === "email") {
        config.email_message = formData.emailMessage;
        // Convertir datetime-local a ISO string en UTC para evitar problemas de zona horaria
        // datetime-local viene en formato "YYYY-MM-DDTHH:mm" (hora local del navegador)
        // Necesitamos convertir la hora local del usuario a UTC
        if (formData.emailSendDate) {
          // datetime-local da la fecha en la zona horaria local del navegador
          // new Date() interpreta "YYYY-MM-DDTHH:mm" como hora local
          // Luego convertimos a UTC con toISOString()
          const localDate = new Date(formData.emailSendDate);
          
          // Verificar que la fecha sea válida
          if (isNaN(localDate.getTime())) {
            throw new Error("Invalid date format");
          }
          
          // Convertir a ISO string (UTC) para guardar en la BD
          // Esto preserva la hora que el usuario seleccionó, pero en UTC
          config.email_send_date = localDate.toISOString();
          
          console.log(`[CreateAutomation] Date conversion:`, {
            input: formData.emailSendDate,
            localDate: localDate.toString(),
            isoString: localDate.toISOString(),
            timezoneOffset: localDate.getTimezoneOffset(),
          });
        } else {
          config.email_send_date = formData.emailSendDate;
        }
        config.client_id = formData.selectedClientId;
      } else if (actionType === "meeting") {
        config.meeting_name = formData.meetingName;
        config.email_content = formData.meetingEmailContent;
        config.client_id = formData.selectedClientId;
      } else if (actionType === "ai-summary") {
        config.client_id = formData.selectedClientId;
      }

      const newAutomation = await createAutomation.mutateAsync({
        name: formData.name,
        description: formData.description || null,
        action_type_type: actionType,
        action_type: actionType, // Alias for compatibility
        is_enabled: true,
        is_active: true, // Alias for compatibility
        config: config,
      });

      toast({
        title: "Automation created",
        description: `"${formData.name}" automation has been created and is now active.`,
      });

      // Close the dialog immediately after creating the automation
      onOpenChange(false);

      // If it's an AI summary automation, execute it automatically in the background
      if (actionType === "ai-summary") {
        // Execute in the background without awaiting (non-blocking)
        executeAutomation.mutate(
          { automation: newAutomation },
          {
            onSuccess: () => {
              toast({
                title: "Summary generated",
                description: "AI summary has been generated successfully.",
              });
            },
            onError: (error: any) => {
              console.error("Error executing automation:", error);
              toast({
                title: "Summary generation failed",
                description: "Automation was created but failed to generate summary. You can generate it manually.",
                variant: "destructive",
              });
            },
          }
        );
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create automation",
        variant: "destructive",
      });
    }
  };

  const selectedAction = actionTypes.find(a => a.value === actionType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Custom Automation</DialogTitle>
          <DialogDescription>
            Set up an automated workflow. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Automation Name *</Label>
              <Input
                id="name"
                placeholder="Welcome Email Flow"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-border/60 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Action *</Label>
              <Select
                value={actionType}
                onValueChange={(value) => setActionType(value as ActionType)}
              >
                <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="What should happen?" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      <div className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAction && (
                <p className="text-xs text-muted-foreground mt-1">{selectedAction.description}</p>
              )}
            </div>
          </div>

          {/* Action-specific fields */}
          {actionType && (
            <div className="space-y-5 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
              <h3 className="font-semibold text-foreground text-base mb-1">Action Configuration</h3>
              
              {/* Email Action */}
              {actionType === "email" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="selectedClientEmail" className="text-sm font-medium">Select Client *</Label>
                    <Select
                      value={formData.selectedClientId}
                      onValueChange={(value) => setFormData({ ...formData, selectedClientId: value })}
                    >
                      <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <SelectItem value="no-clients" disabled>
                            No clients available
                          </SelectItem>
                        ) : (
                          clients.map((client) => {
                            const clientId = client.id || (client as any).client_id;
                            return (
                              <SelectItem key={clientId} value={clientId}>
                                {client.name} {client.email ? `(${client.email})` : ""}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailMessage" className="text-sm font-medium">Custom message to send *</Label>
                    <Textarea
                      id="emailMessage"
                      placeholder="Write your email message here..."
                      value={formData.emailMessage}
                      onChange={(e) => setFormData({ ...formData, emailMessage: e.target.value })}
                      rows={5}
                      className="border-border/60 focus:border-primary/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailSendDate" className="text-sm font-medium">Date of sending *</Label>
                    <Input
                      id="emailSendDate"
                      type="datetime-local"
                      value={formData.emailSendDate}
                      onChange={(e) => setFormData({ ...formData, emailSendDate: e.target.value })}
                      className="border-border/60 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* AI Client Summary Action */}
              {actionType === "ai-summary" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="selectedClient" className="text-sm font-medium">Select Client *</Label>
                    <Select
                      value={formData.selectedClientId}
                      onValueChange={(value) => setFormData({ ...formData, selectedClientId: value })}
                    >
                      <SelectTrigger className="border-border/60 focus:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choose a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.length === 0 ? (
                          <SelectItem value="no-clients" disabled>No clients available</SelectItem>
                        ) : (
                          clients.map((client) => {
                            const clientId = client.id || (client as any).client_id;
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
                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 shadow-sm">
                    <p className="text-sm text-foreground leading-relaxed">
                      <Zap className="h-4 w-4 inline mr-2 text-primary" />
                      AI will automatically generate a summary of client interactions, preferences, and next steps.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this automation does..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="border-border/60 focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-border/60">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="transition-all">
              Cancel
            </Button>
            <Button type="submit" disabled={createAutomation.isPending} className="shadow-sm hover:shadow-md transition-all">
              {createAutomation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Automation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
