import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Shield, Palette, Mail, Smartphone, Loader2, LogOut } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Actualizar formData cuando el perfil se carga
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        company: profile.company || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      company: formData.company || null,
      phone: formData.phone || null,
      // No actualizamos email aquí porque viene de auth.users
    });
  };

  const handleUpdatePassword = async () => {
    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "New password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: "Error",
        description: "New password must be different from current password",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Obtener el email del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        throw new Error("User not found");
      }

      // Verificar que la contraseña actual sea correcta intentando hacer sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Si la contraseña actual es correcta, actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // Limpiar el formulario
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6 max-w-3xl space-y-8">
        {/* Profile Section */}
        <section className="rounded-xl bg-card border border-border p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Profile</h2>
              <p className="text-sm text-muted-foreground">Your personal information</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="sm:col-span-2">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="sm:col-span-2">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="mt-1"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="mt-1"
                  placeholder="Doe"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="mt-1 bg-muted"
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed here. Contact support to update your email.
                </p>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="company" className="text-sm font-medium text-foreground">
                  Company
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1"
                  placeholder="Acme Corp"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={isLoading || isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </section>

        {/* Security Section */}
        <section className="rounded-xl bg-card border border-border p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Security</h2>
              <p className="text-sm text-muted-foreground">Secure your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="••••••••"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="mt-1"
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="mt-1"
                disabled={isUpdatingPassword}
                minLength={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="mt-1"
                disabled={isUpdatingPassword}
                minLength={6}
              />
              {passwordData.newPassword &&
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">
                    Passwords do not match
                  </p>
                )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </section>

        {/* Logout Section */}
        <section className="rounded-xl bg-card border border-border p-6 shadow-card animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Logout</h2>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you log out, you'll need to sign in again to access your account.
            </p>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
