import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useClients, type Client } from "@/hooks/useClients";
import { useDeals } from "@/hooks/useDeals";
import { useCreatePrioritization, calculateFinalPriority } from "@/hooks/usePrioritization";
import { analyzeImageWithOpenAI } from "@/lib/openai-pdf-analyzer";
import { Loader2, Search, Building2, Mail, ArrowLeft, Image as ImageIcon, X, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PrioritizationAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ActiveDealsOption = "1" | "2" | "3+";
type FrequencyOption = "1-2times" | "3-5times" | "6-9times" | "10+times";
type WhoInitiatedOption = "client" | "you";
type PendingProposalOption = "yes" | "no";

export function PrioritizationAutomationDialog({
  open,
  onOpenChange,
}: PrioritizationAutomationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: clients = [], isLoading } = useClients();
  const { data: deals = [] } = useDeals();
  const createPrioritization = useCreatePrioritization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingPDF, setIsAnalyzingPDF] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"continue" | "submit" | null>(null);
  const [hasExistingPrioritization, setHasExistingPrioritization] = useState(false);
  
  // Calculate active deals count for selected client
  const activeDealsCount = useMemo(() => {
    if (!selectedClient) return 0;
    const clientDeals = deals.filter((deal: any) => {
      const dealClientId = deal.client_id || deal.clients?.id || (deal as any).clients?.client_id;
      return String(dealClientId) === String(selectedClient.id) && deal.stage !== "Closed";
    });
    return clientDeals.length;
  }, [selectedClient, deals]);

  // Convert count to ActiveDealsOption format
  const activeDeals: ActiveDealsOption = useMemo(() => {
    if (activeDealsCount === 0) return "1"; // Default to "1" if no deals
    if (activeDealsCount === 1) return "1";
    if (activeDealsCount === 2) return "2";
    return "3+"; // 3 or more
  }, [activeDealsCount]);

  const [interactionFrequency, setInteractionFrequency] = useState<FrequencyOption | "">("");
  const [showOptionalForm, setShowOptionalForm] = useState(false);
  
  // Optional fields
  const [notes, setNotes] = useState("");
  const [whoInitiated, setWhoInitiated] = useState<WhoInitiatedOption | "">("");
  const [pendingProposal, setPendingProposal] = useState<PendingProposalOption | "">("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setInteractionFrequency("");
      setSelectedClient(null);
      setShowForm(false);
      setSearchQuery("");
      setShowOptionalForm(false);
      setWhoInitiated("");
      setPendingProposal("");
      setUploadedFile(null);
      setShowWarningDialog(false);
      setPendingAction(null);
      setHasExistingPrioritization(false);
    }
  }, [open]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if client has existing prioritization
  const checkExistingPrioritization = async (clientId: string): Promise<boolean> => {
    if (!user?.id) {
      console.log("[Prioritization] No user ID, returning false");
      return false;
    }
    try {
      console.log("[Prioritization] Checking for existing prioritization for client:", clientId, "user:", user.id);
      
      // Try multiple query approaches
      // Approach 1: Query all prioritizations for this user and filter client-side
      const { data: allPrioritizations, error: allError } = await (supabase as any)
        .from("client_prioritizations")
        .select("id, client_id, user_id");
      
      console.log("[Prioritization] All prioritizations query:", { data: allPrioritizations, error: allError });
      
      if (allPrioritizations && Array.isArray(allPrioritizations)) {
        const matching = allPrioritizations.find((p: any) => 
          String(p.client_id) === String(clientId) && String(p.user_id) === String(user.id)
        );
        if (matching) {
          console.log("[Prioritization] Found existing prioritization via all query:", matching);
          return true;
        }
      }
      
      // Approach 2: Direct query with client_id
      const { data, error } = await (supabase as any)
        .from("client_prioritizations")
        .select("id, client_id, user_id")
        .eq("client_id", clientId);
      
      console.log("[Prioritization] Direct query result:", { data, error });
      
      if (error) {
        console.log("[Prioritization] Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // PGRST116 = no rows returned (this is expected when no prioritization exists)
        if (error.code === "PGRST116" || error.message?.includes("No rows") || error.message?.includes("0 rows")) {
          console.log("[Prioritization] No existing prioritization found (expected)");
          return false;
        }
      }
      
      if (data && Array.isArray(data) && data.length > 0) {
        // Check if any of the results match the current user
        const userMatch = data.find((p: any) => String(p.user_id) === String(user.id));
        if (userMatch) {
          console.log("[Prioritization] Found existing prioritization:", userMatch);
          return true;
        }
      }
      
      console.log("[Prioritization] No existing prioritization found");
      return false;
    } catch (error) {
      console.error("[Prioritization] Exception checking prioritization:", error);
      return false;
    }
  };

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
    // Check if client has existing prioritization
    const hasExisting = await checkExistingPrioritization(client.id);
    setHasExistingPrioritization(hasExisting);
  };

  const handleBackToClientSelection = () => {
    setShowForm(false);
    setShowOptionalForm(false);
    setSelectedClient(null);
    setInteractionFrequency("");
    setWhoInitiated("");
    setPendingProposal("");
    setUploadedFile(null);
  };

  const executeContinue = async () => {
    if (!selectedClient) return;

    setIsSubmitting(true);

    try {
      // Calculate priority from mandatory questions only
      const calculatedPriority = calculateFinalPriority({
        activeDeals: [activeDeals],
        interactionFrequency: [interactionFrequency],
      });

      // Save prioritization data
      await createPrioritization.mutateAsync({
        client_id: selectedClient.id,
        active_deals: [activeDeals],
        interaction_frequency: [interactionFrequency],
        calculated_priority: calculatedPriority,
      });

      toast({
        title: "Prioritization saved",
        description: `Prioritization for ${selectedClient.name} has been configured successfully. Priority: ${calculatedPriority}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save prioritization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedClient) {
      toast({
        title: "Client not selected",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    if (!interactionFrequency) {
      toast({
        title: "Required fields",
        description: "Please select an option for the interaction frequency question.",
        variant: "destructive",
      });
      return;
    }

    // Check if client has existing prioritization
    const hasExisting = await checkExistingPrioritization(selectedClient.id);
    console.log("[Prioritization] handleContinue - hasExisting:", hasExisting);
    setHasExistingPrioritization(hasExisting);

    if (hasExisting) {
      console.log("[Prioritization] Showing warning dialog");
      setPendingAction("continue");
      setShowWarningDialog(true);
    } else {
      console.log("[Prioritization] No existing prioritization, proceeding directly");
      executeContinue();
    }
  };

  const handleFrequencyChange = (value: string) => {
    setInteractionFrequency(value as FrequencyOption);
  };

  const handleWhoInitiatedChange = (value: string) => {
    setWhoInitiated(value as WhoInitiatedOption);
  };

  const handlePendingProposalChange = (value: string) => {
    setPendingProposal(value as PendingProposalOption);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept image formats: jpg, jpeg, png
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files (JPG, JPEG or PNG).",
          variant: "destructive",
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const executeSubmit = async () => {
    if (!selectedClient) return;

    setIsSubmitting(true);

    try {
      let pdfPriority: "low" | "medium" | "high" | undefined;
      let pdfKeywordsCount: number | undefined;
      let pdfSentiment: "low" | "mid" | "high" | undefined;

      // Analyze image if uploaded
      if (uploadedFile) {
        setIsAnalyzingPDF(true);
        try {
          // analyzeImageWithOpenAI will automatically get the API key from environment
          const analysis = await analyzeImageWithOpenAI(uploadedFile);
          pdfPriority = analysis.priority;
          pdfKeywordsCount = analysis.keywordsCount;
          pdfSentiment = analysis.sentiment;

          toast({
            title: "Image analyzed",
            description: `Analysis completed: ${analysis.keywordsCount} keywords, sentiment ${analysis.sentiment}, priority ${analysis.priority}.`,
          });
        } catch (imageError: any) {
          console.error("Error analyzing image:", imageError);
          toast({
            title: "Warning",
            description: `Could not analyze image: ${imageError.message}. Continuing without image analysis.`,
            variant: "default",
          });
        } finally {
          setIsAnalyzingPDF(false);
        }
      }

      // Calculate final priority with all data
      const calculatedPriority = calculateFinalPriority({
        activeDeals: [activeDeals],
        interactionFrequency: [interactionFrequency],
        whoInitiated: whoInitiated ? [whoInitiated] : undefined,
        pendingProposal: pendingProposal ? [pendingProposal] : undefined,
        pdfPriority,
        pdfKeywordsCount,
        pdfSentiment,
      });

      // Save prioritization data
      await createPrioritization.mutateAsync({
        client_id: selectedClient.id,
        active_deals: [activeDeals],
        interaction_frequency: [interactionFrequency],
        who_initiated: whoInitiated ? [whoInitiated] : undefined,
        pending_proposal: pendingProposal ? [pendingProposal] : undefined,
        pdf_priority: pdfPriority,
        pdf_keywords_count: pdfKeywordsCount,
        pdf_sentiment: pdfSentiment,
        calculated_priority: calculatedPriority,
      });

      toast({
        title: "Prioritization saved",
        description: `Prioritization for ${selectedClient.name} has been configured successfully. Final priority: ${calculatedPriority}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save prioritization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      toast({
        title: "Client not selected",
        description: "Please select a client first.",
        variant: "destructive",
      });
      return;
    }

    if (!interactionFrequency) {
      toast({
        title: "Required fields",
        description: "Please select an option for the interaction frequency question.",
        variant: "destructive",
      });
      return;
    }

    // Check if client has existing prioritization
    const hasExisting = await checkExistingPrioritization(selectedClient.id);
    console.log("[Prioritization] handleSubmit - hasExisting:", hasExisting);
    setHasExistingPrioritization(hasExisting);

    if (hasExisting) {
      console.log("[Prioritization] Showing warning dialog");
      setPendingAction("submit");
      setShowWarningDialog(true);
    } else {
      console.log("[Prioritization] No existing prioritization, proceeding directly");
      executeSubmit();
    }
  };

  const handleConfirmWarning = () => {
    setShowWarningDialog(false);
    if (pendingAction === "continue") {
      executeContinue();
    } else if (pendingAction === "submit") {
      executeSubmit();
    }
    setPendingAction(null);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showForm ? "Automate Prioritization" : "Select Client"}
          </DialogTitle>
          <DialogDescription>
            {showForm
              ? `Configure the rules to automate prioritization for ${selectedClient?.name}`
              : "Choose a client to automate their prioritization"}
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          // Client Selection View
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
                    onClick={() => handleClientSelect(client)}
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

            <DialogFooter className="pt-4 border-t border-border/60">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="transition-all">
                Cancel
              </Button>
            </DialogFooter>
          </div>
        ) : !showOptionalForm ? (
          // Required Form View
          <div className="space-y-6">
            {/* Selected Client Info */}
            {selectedClient && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm shadow-sm">
                    {selectedClient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base">{selectedClient.name}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedClient.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Required Section */}
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-foreground mb-1">Required</h3>

              {/* Active Deals Display (Read-only) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Number of active deals with the client:
                </Label>
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Active deals count:</span>
                    <span className="text-xl font-bold text-primary">
                      {activeDealsCount} {activeDealsCount === 1 ? "deal" : "deals"}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-primary/20">
                    <span className="text-xs text-muted-foreground">
                      This value will be used for prioritization calculation (weight: {activeDeals === "1" ? "1 deal" : activeDeals === "2" ? "2 deals" : "3+ deals"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Second Question */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Interaction frequency last 14 days? *
                </Label>
                <RadioGroup
                  value={interactionFrequency}
                  onValueChange={handleFrequencyChange}
                  className="space-y-3 pl-1"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="1-2times" id="1-2times" />
                    <Label
                      htmlFor="1-2times"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      1 - 2 times
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="3-5times" id="3-5times" />
                    <Label
                      htmlFor="3-5times"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      3 - 5 times
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="6-9times" id="6-9times" />
                    <Label
                      htmlFor="6-9times"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      6 - 9 times
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value="10+times" id="10+times" />
                    <Label
                      htmlFor="10+times"
                      className="text-sm font-medium cursor-pointer flex-1"
                    >
                      +10 times
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToClientSelection}
                disabled={isSubmitting}
                className="transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOptionalForm(true)}
                disabled={isSubmitting}
                className="transition-all hover:bg-primary/10 hover:border-primary/30"
              >
                Optional Settings
              </Button>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={isSubmitting || createPrioritization.isPending}
                className="shadow-sm hover:shadow-md transition-all"
              >
                {(isSubmitting || createPrioritization.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Optional Form View
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Client Info */}
            {selectedClient && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm shadow-sm">
                    {selectedClient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-base">{selectedClient.name}</p>
                    {selectedClient.email && (
                      <p className="text-sm text-muted-foreground mt-0.5">{selectedClient.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Optional Section */}
            <div className="space-y-6">
              <h3 className="text-base font-semibold text-foreground mb-1">Optional Settings</h3>

              {/* Advanced Settings */}
              <div className="space-y-5 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                {/* Who initiated contact? */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    Who initiated contact?
                  </Label>
                  <RadioGroup
                    value={whoInitiated}
                    onValueChange={handleWhoInitiatedChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="client" id="client-initiated" />
                      <Label
                        htmlFor="client-initiated"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Client
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="you" id="you-initiated" />
                      <Label
                        htmlFor="you-initiated"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        You
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Pending proposal */}
                <div className="space-y-3 pt-2 border-t border-border/60">
                  <Label className="text-sm font-medium text-foreground">
                    Is there any pending proposal between you and the client? (meeting, call, etc.)
                  </Label>
                  <RadioGroup
                    value={pendingProposal}
                    onValueChange={handlePendingProposalChange}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="yes" id="pending-yes" />
                      <Label
                        htmlFor="pending-yes"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="no" id="pending-no" />
                      <Label
                        htmlFor="pending-no"
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {/* Upload Image */}
              <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
                <div>
                  <Label htmlFor="image-upload" className="text-sm font-medium text-foreground">
                    Upload image
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Upload an image (JPG/PNG) with details about the client or conversation with client.
                  </p>
                </div>
                <div className="space-y-3">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                    className="cursor-pointer border-border/60 focus:border-primary/50 transition-colors"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <ImageIcon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1 truncate">
                        {uploadedFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => {
                          setUploadedFile(null);
                          const input = document.getElementById("image-upload") as HTMLInputElement;
                          if (input) input.value = "";
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOptionalForm(false)}
                disabled={isSubmitting}
                className="transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="transition-all"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isAnalyzingPDF || createPrioritization.isPending} className="shadow-sm hover:shadow-md transition-all">
                {(isSubmitting || isAnalyzingPDF || createPrioritization.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAnalyzingPDF ? "Analyzing image..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    {/* Warning Dialog for existing prioritization - Outside main Dialog */}
    <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 shadow-sm flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl mb-2">Update existing prioritization?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                This client already has a prioritization configured. If you continue, the previous information will be replaced by the new configuration.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4 border-t border-border/60">
          <AlertDialogCancel onClick={() => {
            setPendingAction(null);
            setShowWarningDialog(false);
          }} className="transition-all">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmWarning}
            className="bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm hover:shadow-md transition-all"
          >
            Continue and update
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
