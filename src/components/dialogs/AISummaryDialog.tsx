import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Sparkles, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AISummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  automation: {
    name: string;
    description: string | null;
    config?: {
      client_id?: string;
    };
  } | null;
  summaryData: {
    clientName: string;
    summary: string;
    generatedAt: string;
    clientId?: string;
  } | null;
  clientName?: string;
}

export function AISummaryDialog({
  open,
  onOpenChange,
  automation,
  summaryData,
  clientName,
}: AISummaryDialogProps) {
  if (!automation || !summaryData) return null;

  const displayClientName = summaryData.clientName || clientName || "Unknown Client";
  const generatedDate = summaryData.generatedAt
    ? new Date(summaryData.generatedAt)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{automation.name}</DialogTitle>
              <DialogDescription>
                AI-generated client summary
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Client Information */}
          <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/60 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</p>
              <p className="text-lg font-semibold text-foreground mt-0.5">{displayClientName}</p>
            </div>
          </div>

          {/* Summary Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Summary</h3>
              {generatedDate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Generated {formatDistanceToNow(generatedDate, { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 shadow-sm">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {summaryData.summary}
              </p>
            </div>
          </div>

          {/* Automation Info */}
          {automation.description && (
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Automation Description</p>
              <p className="text-sm text-foreground leading-relaxed">{automation.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
