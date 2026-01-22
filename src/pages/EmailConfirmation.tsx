import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Verificar si hay tokens de confirmación en la URL (cuando el usuario hace clic en el enlace)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Si hay una sesión, significa que el usuario ya confirmó su correo
        navigate("/");
        return;
      }
    };

    checkSession();

    // Obtener el email de los query params si existe
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams, navigate]);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      // Intentar reenviar el correo de confirmación
      const { data, error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("Error resending email:", error);
        throw error;
      }

      console.log("Confirmation email resent:", data);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error: any) {
      console.error("Error resending email:", error);
      // Mostrar error al usuario
      alert(`Error resending email: ${error.message || "Unknown error"}`);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-base">
            We've sent a confirmation link to
            {email ? (
              <span className="font-semibold text-foreground block mt-1">{email}</span>
            ) : (
              <span className="font-semibold text-foreground block mt-1">your email address</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open your email inbox</li>
                  <li>Look for an email from us</li>
                  <li>Click the confirmation link in the email</li>
                  <li>You'll be automatically signed in</li>
                </ol>
              </div>
            </div>

            {email && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn't receive the email? Check your spam folder or resend it.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isResending || resendSuccess}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Email sent!
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend confirmation email
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
