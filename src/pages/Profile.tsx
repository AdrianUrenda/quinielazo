import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Wallet, LogOut, Trash2, Save, KeyRound } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingName, setSavingName] = useState(false);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deletingAccount, setDeletingAccount] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === "google";

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();
      if (data) setDisplayName(data.display_name);
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("Error al actualizar el nombre");
    } else {
      toast.success("Nombre actualizado");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error("Error al cambiar la contraseña");
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    const { error } = await supabase.rpc("delete_user_account");
    if (error) {
      toast.error("Error al eliminar la cuenta");
      setDeletingAccount(false);
      return;
    }
    await supabase.auth.signOut();
    toast.success("Cuenta eliminada permanentemente");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl pt-24 pb-12 px-4 space-y-6">
        <h1 className="font-display text-3xl text-foreground tracking-wide">Mi Perfil</h1>

        {/* Section 1: Edit Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5" />
              Editar Perfil
            </CardTitle>
            <CardDescription>Actualiza tu información personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre de usuario</Label>
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  disabled={loadingProfile}
                />
                <Button onClick={handleSaveName} disabled={savingName || loadingProfile} className="gap-1.5">
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
              </div>
            </div>

            {!isGoogleUser && (
              <div className="space-y-3 pt-2 border-t border-border">
                {!showPasswordFields ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordFields(true)}
                    className="gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    Modificar contraseña
                  </Button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword} disabled={savingPassword} className="gap-1.5">
                        <Save className="w-4 h-4" />
                        Guardar contraseña
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordFields(false);
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Wallet placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Wallet className="w-5 h-5" />
              Billetera
            </CardTitle>
            <CardDescription>Gestiona tus ganancias y retiros</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Saldo disponible</p>
              <p className="text-3xl font-display font-bold text-foreground mt-1">$0.00 MXN</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block w-full">
                  <Button variant="outline" className="w-full" disabled>
                    Solicitar retiro
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Próximamente</TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        {/* Section 3: Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleLogout}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>

        {/* Section 4: Delete Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-destructive">
              <Trash2 className="w-5 h-5" />
              Eliminar cuenta
            </CardTitle>
            <CardDescription>
              Esta acción es permanente e irreversible. Todos tus datos serán eliminados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="w-4 h-4" />
                  Eliminar mi cuenta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción es <strong>irreversible</strong>. Se eliminarán permanentemente tu cuenta,
                    predicciones, membresías de grupo, notificaciones y todos los datos asociados.
                    Los grupos donde eres administrador también serán eliminados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAccount ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
