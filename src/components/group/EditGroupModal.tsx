import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: {
    id: string;
    name: string;
    description: string | null;
    access_code: string | null;
  };
}

const EditGroupModal = ({ open, onOpenChange, group }: Props) => {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(group.description || "");
  const [accessCode, setAccessCode] = useState(group.access_code || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(group.description || "");
      setAccessCode(group.access_code || "");
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

          <Button className="w-full h-11" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupModal;
