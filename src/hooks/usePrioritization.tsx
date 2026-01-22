import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type PriorityLevel = "low" | "medium" | "high";

export interface PrioritizationData {
  client_id: string;
  // Mandatory questions
  active_deals: string[]; // ["1", "2", "3+"]
  interaction_frequency: string[]; // ["1-2times", "3-5times", "6-9times", "10+times"]
  // Advanced options
  who_initiated?: string[]; // ["client", "you"]
  pending_proposal?: string[]; // ["yes", "no"]
  // PDF analysis
  pdf_priority?: PriorityLevel;
  pdf_keywords_count?: number;
  pdf_sentiment?: "low" | "mid" | "high";
  // Calculated priority
  calculated_priority: PriorityLevel;
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface PrioritizationResponse {
  id: string;
  client_id: string;
  calculated_priority: PriorityLevel;
  created_at: string;
  updated_at: string;
}

/**
 * Calculates priority based on mandatory questions
 */
export function calculateMandatoryPriority(
  activeDeals: string[],
  interactionFrequency: string[]
): PriorityLevel {
  // High priority conditions
  const hasHighDeals = activeDeals.includes("2") || activeDeals.includes("3+");
  const hasHighFrequency = interactionFrequency.includes("6-9times") || interactionFrequency.includes("10+times");
  
  if (hasHighDeals && hasHighFrequency) {
    return "high";
  }

  // Medium priority conditions
  const hasMediumDeals = activeDeals.includes("1");
  const hasMediumFrequency = interactionFrequency.includes("3-5times");
  
  if (hasMediumDeals && hasMediumFrequency) {
    return "medium";
  }

  // Low priority conditions
  const hasLowFrequency = interactionFrequency.includes("1-2times");
  
  if (hasLowFrequency) {
    return "low";
  }

  // Default to medium if no clear match
  return "medium";
}

/**
 * Adjusts priority based on advanced options
 */
export function adjustPriorityWithAdvanced(
  basePriority: PriorityLevel,
  whoInitiated?: string[],
  pendingProposal?: string[]
): PriorityLevel {
  let adjustedPriority = basePriority;

  // High priority boosters
  const clientInitiated = whoInitiated?.includes("client");
  const hasPendingProposal = pendingProposal?.includes("yes");
  
  if (clientInitiated && hasPendingProposal) {
    // Boost priority
    if (adjustedPriority === "low") adjustedPriority = "medium";
    if (adjustedPriority === "medium") adjustedPriority = "high";
  }

  // Low priority indicators
  const youInitiated = whoInitiated?.includes("you");
  const noPendingProposal = pendingProposal?.includes("no");
  
  if (youInitiated && noPendingProposal) {
    // Lower priority
    if (adjustedPriority === "high") adjustedPriority = "medium";
    if (adjustedPriority === "medium") adjustedPriority = "low";
  }

  return adjustedPriority;
}

/**
 * Adjusts priority based on PDF analysis
 */
export function adjustPriorityWithPDF(
  basePriority: PriorityLevel,
  pdfPriority?: PriorityLevel,
  pdfKeywordsCount?: number,
  pdfSentiment?: "low" | "mid" | "high"
): PriorityLevel {
  if (!pdfPriority && !pdfKeywordsCount && !pdfSentiment) {
    return basePriority;
  }

  let adjustedPriority = basePriority;

  // Use PDF priority if available
  if (pdfPriority) {
    // Combine priorities: take the higher one
    const priorityOrder = { low: 1, medium: 2, high: 3 };
    const baseOrder = priorityOrder[basePriority];
    const pdfOrder = priorityOrder[pdfPriority];
    
    adjustedPriority = pdfOrder > baseOrder ? pdfPriority : basePriority;
  }

  // Adjust based on sentiment
  if (pdfSentiment === "high") {
    if (adjustedPriority === "low") adjustedPriority = "medium";
    if (adjustedPriority === "medium") adjustedPriority = "high";
  } else if (pdfSentiment === "low") {
    if (adjustedPriority === "high") adjustedPriority = "medium";
    if (adjustedPriority === "medium") adjustedPriority = "low";
  }

  return adjustedPriority;
}

/**
 * Main function to calculate final priority
 */
export function calculateFinalPriority(data: {
  activeDeals: string[];
  interactionFrequency: string[];
  whoInitiated?: string[];
  pendingProposal?: string[];
  pdfPriority?: PriorityLevel;
  pdfKeywordsCount?: number;
  pdfSentiment?: "low" | "mid" | "high";
}): PriorityLevel {
  // Step 1: Calculate base priority from mandatory questions
  let priority = calculateMandatoryPriority(data.activeDeals, data.interactionFrequency);

  // Step 2: Adjust with advanced options
  priority = adjustPriorityWithAdvanced(
    priority,
    data.whoInitiated,
    data.pendingProposal
  );

  // Step 3: Adjust with PDF analysis
  priority = adjustPriorityWithPDF(
    priority,
    data.pdfPriority,
    data.pdfKeywordsCount,
    data.pdfSentiment
  );

  return priority;
}

export function useCreatePrioritization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: Omit<PrioritizationData, "created_at" | "updated_at" | "calculated_priority"> & { calculated_priority?: PriorityLevel }) => {
      if (!user?.id) {
        throw new Error("User must be authenticated to create prioritization");
      }

      // Calculate final priority
      const calculatedPriority = data.calculated_priority || calculateFinalPriority({
        activeDeals: data.active_deals,
        interactionFrequency: data.interaction_frequency,
        whoInitiated: data.who_initiated,
        pendingProposal: data.pending_proposal,
        pdfPriority: data.pdf_priority,
        pdfKeywordsCount: data.pdf_keywords_count,
        pdfSentiment: data.pdf_sentiment,
      });

      const prioritizationData: any = {
        client_id: data.client_id,
        user_id: null as any, // El trigger lo asignará automáticamente desde auth.uid()
        active_deals: data.active_deals,
        interaction_frequency: data.interaction_frequency,
        who_initiated: data.who_initiated || null,
        pending_proposal: data.pending_proposal || null,
        pdf_priority: data.pdf_priority || null,
        pdf_keywords_count: data.pdf_keywords_count || null,
        pdf_sentiment: data.pdf_sentiment || null,
        calculated_priority: calculatedPriority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // @ts-ignore - client_prioritizations table not yet in types, will be added after migration
      const { data: result, error } = await (supabase as any)
        .from("client_prioritizations")
        .insert(prioritizationData)
        .select()
        .single();

      if (error) {
        console.error("Error creating prioritization:", error);
        throw new Error(`Failed to save prioritization: ${error.message}`);
      }

      const resultData = result as any;

      return {
        id: resultData.id,
        client_id: resultData.client_id,
        calculated_priority: resultData.calculated_priority,
        created_at: resultData.created_at,
        updated_at: resultData.updated_at,
      } as PrioritizationResponse;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["prioritizations"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Wait a bit for the trigger to execute, then force refetch to get updated priority
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.refetchQueries({ queryKey: ["clients"] });
    },
  });
}
