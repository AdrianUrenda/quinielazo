import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, FileText, Trash2, Trophy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    description: string | null;
    access_code: string | null;
    prize_description: string | null;
  };
}

const EditGroupModal = ({ open, onOpenChange, group }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [description, setDescription] = useState(group.description || "");
  const [accessCode, setAccessCode] = useState(group.access_code || "");
  const [prizeDescription, setPrizeDescription] = useState(group.prize_description || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(group.description || "");
      setAccessCode(group.access_code || "");
      setPrizeDescription(group.prize_description || "");
    }
  }, [open, group]);

  const handleSave = async () => {
    if (accessCode && (accessCode.length < 4 || accessCode.length > 8)) {
      toast.error("El código de acceso debe tener entre 4 y 8 caracteres.");
      return;
    }
    if (accessCode && !/^[a-zA-Z0-9]+$/.test(accessCode)) {
      toast.error("El código de acceso solo puede contener letras y números.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("groups")
        .update({
          description: description.trim() || null,
          access_code: accessCode.trim() || null,
          prize_description: prizeDescription.trim() || null,
        })
        .eq("id", group.id);

      if (error) throw error;

      toast.success("Grupo actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el grupo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("groups")
        .delete()
        .eq("id", group.id);

      if (error) throw error;

      toast.success("Grupo eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      onOpenChange(false);
      navigate("/groups");
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar el grupo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display tracking-wide">EDITAR GRUPO</DialogTitle>
          <DialogDescription className="font-body">
            Modifica la descripción y el código de acceso de <span className="font-semibold text-foreground">{group.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-body text-sm flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Descripción
            </Label>
            <Textarea
              placeholder="Describe tu grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground font-body text-right">{description.length}/200</p>
          </div>

          <div className="space-y-2">
            <Label className="font-body text-sm flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Código de acceso
            </Label>
            <Input
              placeholder="Ej: migrupo1 (4-8 caracteres)"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground font-body">
              Los usuarios necesitarán este código para solicitar unirse. Déjalo vacío para permitir acceso libre.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-body text-sm flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" /> Premio del grupo (opcional)
            </Label>
            <Textarea
              placeholder='Ej: "$500 MXN al ganador, vaquita por Mercado Pago"'
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              maxLength={300}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground font-body text-right">{prizeDescription.length}/300</p>
          </div>

          <Button className="w-full h-11" onClick={handleSave} disabled={saving || deleting}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>

          <div className="border-t border-border pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full h-11" disabled={saving || deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {deleting ? "Eliminando..." : "Eliminar grupo"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">¿ELIMINAR GRUPO?</AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    Esta acción es irreversible. Se eliminará el grupo <span className="font-semibold text-foreground">"{group.name}"</span>, todos sus miembros y todas las predicciones asociadas. No hay reembolsos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
                  >
                    Sí, eliminar grupo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupModal;
