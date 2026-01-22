import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener perfil del usuario desde user_metadata
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Obtener datos del usuario actualizado
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) return null;

      // Extraer datos de user_metadata
      const metadata = currentUser.user_metadata || {};
      
      return {
        id: currentUser.id,
        first_name: metadata.first_name || null,
        last_name: metadata.last_name || null,
        company: metadata.company || null,
        email: currentUser.email || null,
        phone: metadata.phone || null,
      } as Profile;
    },
    enabled: !!user,
  });

  // Actualizar perfil usando user_metadata
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("User not authenticated");

      // Obtener metadata actual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("User not found");

      const currentMetadata = currentUser.user_metadata || {};
      
      // Preparar nuevos metadatos (solo actualizar los campos que vienen en updates)
      const newMetadata = {
        ...currentMetadata,
        ...(updates.first_name !== undefined && { first_name: updates.first_name }),
        ...(updates.last_name !== undefined && { last_name: updates.last_name }),
        ...(updates.company !== undefined && { company: updates.company }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
      };

      // Actualizar user_metadata
      const { data, error } = await supabase.auth.updateUser({
        data: newMetadata,
      });

      if (error) throw error;

      // Retornar perfil actualizado
      return {
        id: data.user.id,
        first_name: newMetadata.first_name || null,
        last_name: newMetadata.last_name || null,
        company: newMetadata.company || null,
        email: data.user.email || null,
        phone: newMetadata.phone || null,
      } as Profile;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      // Refrescar el usuario para obtener los nuevos metadatos
      await supabase.auth.refreshSession();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
  };
}
