import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeAutomation } from "@/lib/automation-executor";
import type { Automation } from "./useAutomations";
import { useToast } from "./use-toast";

export interface ExecuteAutomationOptions {
  clientEmail?: string;
}

export function useExecuteAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      automation,
      options,
    }: {
      automation: Automation;
      options?: ExecuteAutomationOptions;
    }) => {
      const result = await executeAutomation(automation, options);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result;
    },
    onSuccess: (result, variables) => {
      const automationId = variables.automation.automation_id || variables.automation.id;
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      queryClient.invalidateQueries({ queryKey: ["automation-runs"] });
      queryClient.invalidateQueries({ queryKey: ["automation-runs-list"] });
      
      // Force refetch the specific automation run query after a short delay
      // This ensures the database has time to commit the transaction
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ["automation-runs", automationId],
          exact: false 
        });
      }, 500);
      
      toast({
        title: "Automation executed",
        description: result.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Automation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
