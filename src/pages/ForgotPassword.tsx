import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("¡Correo enviado! Revisa tu bandeja de entrada.");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Trophy className="w-8 h-8 text-gold" />
            <span className="font-display text-3xl text-primary-foreground tracking-wider">QUINIELAZO</span>
          </Link>
          <h1 className="text-4xl font-display text-primary-foreground tracking-wide">RECUPERAR CONTRASEÑA</h1>
          <p className="text-primary-foreground/60 font-body mt-2">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <Mail className="w-12 h-12 text-primary mx-auto" />
              <p className="font-body text-foreground">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
              </p>
              <p className="font-body text-muted-foreground text-sm">
                Revisa tu bandeja de entrada y sigue las instrucciones del correo.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4 font-body">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-body text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-10 h-12 font-body"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 font-body text-base" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-muted-foreground font-body hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
