import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye, EyeOff, Copy, Check, PartyPopper } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tier = "basico" | "familiar" | "grande";

const tiers: { value: Tier; label: string; desc: string; price: string }[] = [
  { value: "basico", label: "Básico", desc: "Hasta 10 miembros", price: "$49 MXN" },
  { value: "familiar", label: "Familiar", desc: "Hasta 20 miembros", price: "$99 MXN" },
  { value: "grande", label: "Grande", desc: "Miembros ilimitados", price: "$199 MXN" },
];

const CreateGroupModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [tier, setTier] = useState<Tier>("basico");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ groupId: string; inviteLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("El nombre del grupo es obligatorio");
      return;
    }
    if (accessCode && (accessCode.length < 4 || accessCode.length > 8 || !/^[a-zA-Z0-9]+$/.test(accessCode))) {
      toast.error("El código debe ser alfanumérico de 4 a 8 caracteres");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          name: name.trim(),
          description: description.trim() || null,
          tier,
          access_code: accessCode.trim() || null,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No se recibió URL de pago");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar el pago");
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (success) {
      navigator.clipboard.writeText(success.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setAccessCode("");
    setTier("basico");
    setSuccess(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="text-center py-4 space-y-4">
            <PartyPopper className="w-12 h-12 text-gold mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-display tracking-wide">¡GRUPO CREADO!</DialogTitle>
              <DialogDescription className="font-body">
                Comparte el enlace de invitación con tus amigos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              <code className="text-xs font-mono text-foreground flex-1 break-all">{success.inviteLink}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={() => { handleClose(); navigate(`/group/${success.groupId}`); }}>
              Ir a mi grupo
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display tracking-wide">CREAR GRUPO</DialogTitle>
              <DialogDescription className="font-body">
                Configura tu grupo de quiniela para el Mundial 2026.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Nombre del grupo *</Label>
                <Input
                  placeholder="Ej: La Oficina"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-body text-sm">Descripción</Label>
                <Textarea
                  placeholder="Breve descripción del grupo (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-body text-sm">Código de acceso</Label>
                <div className="relative">
                  <Input
                    placeholder="4-8 caracteres alfanuméricos"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                    maxLength={8}
                    type={showCode ? "text" : "password"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  Si defines un código, solo quien lo tenga podrá solicitar unirse.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="font-body text-sm">Plan *</Label>
                <RadioGroup value={tier} onValueChange={(v) => setTier(v as Tier)} className="space-y-2">
                  {tiers.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        tier === t.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <RadioGroupItem value={t.value} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold font-body text-foreground">{t.label}</p>
                        <p className="text-xs text-muted-foreground font-body">{t.desc}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground font-body">{t.price}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button className="w-full h-11" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loading ? "Creando..." : "Continuar al pago"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupModal;
