import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, CheckCircle, Users, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedGroupId?: string | null;
  preFilledCode?: string | null;
}

const JoinGroupModal = ({ open, onOpenChange, preSelectedGroupId, preFilledCode }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Fetch all groups for search
  const { data: allGroups } = useQuery({
    queryKey: ["all-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("id, name, description, max_members, access_code, tier").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Get member counts
  const { data: memberCounts } = useQuery({
    queryKey: ["group-member-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("group_id")
        .in("status", ["approved", "pending"]);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((m) => {
        counts[m.group_id] = (counts[m.group_id] || 0) + 1;
      });
      return counts;
    },
    enabled: open,
  });

  // Check existing membership
  const { data: existingMembership } = useQuery({
    queryKey: ["my-membership", selectedGroupId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("group_members")
        .select("status")
        .eq("group_id", selectedGroupId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!selectedGroupId && !!user,
  });

  useEffect(() => {
    if (preSelectedGroupId) setSelectedGroupId(preSelectedGroupId);
    if (preFilledCode) setAccessCode(preFilledCode);
  }, [preSelectedGroupId, preFilledCode]);

  const filtered = useMemo(() => {
    if (!allGroups || !search.trim()) return [];
    const q = search.toLowerCase();
    return allGroups.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 10);
  }, [allGroups, search]);

  const selectedGroup = allGroups?.find((g) => g.id === selectedGroupId);
  const memberCount = selectedGroupId ? (memberCounts?.[selectedGroupId] || 0) : 0;

  const handleSubmit = async () => {
    if (!selectedGroup || !user) return;
    setError("");

    // Edge cases
    if (existingMembership?.status === "approved") {
      setError("Ya eres miembro de este grupo.");
      return;
    }
    if (existingMembership?.status === "pending") {
      setError("Ya tienes una solicitud pendiente para este grupo.");
      return;
    }
    if (memberCount >= selectedGroup.max_members) {
      setError("Este grupo ha alcanzado su límite de miembros.");
      return;
    }

    // Validate access code
    if (selectedGroup.access_code && accessCode !== selectedGroup.access_code) {
      setError("Código incorrecto. Verifica con el administrador del grupo.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("group_members").insert({
        group_id: selectedGroup.id,
        user_id: user.id,
        status: "pending" as any,
      });
      if (insertError) throw insertError;

      // Create notification for admin
      const { data: group } = await supabase.from("groups").select("admin_user_id, name").eq("id", selectedGroup.id).single();
      if (group) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
        await supabase.from("notifications").insert({
          user_id: group.admin_user_id,
          type: "join_request" as any,
          message: `${profile?.display_name || "Un usuario"} quiere unirse a ${group.name}.`,
          metadata: { group_id: selectedGroup.id, requester_id: user.id },
        });
      }

      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["my-groups"] });
    } catch (err: any) {
      toast.error(err.message || "Error al enviar solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearch("");
    setSelectedGroupId(preSelectedGroupId || null);
    setAccessCode(preFilledCode || "");
    setSubmitted(false);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <DialogHeader>
              <DialogTitle className="text-2xl font-display tracking-wide">¡SOLICITUD ENVIADA!</DialogTitle>
              <DialogDescription className="font-body">
                El administrador del grupo debe aprobarla antes de que puedas participar.
              </DialogDescription>
            </DialogHeader>
            <Button className="w-full" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display tracking-wide">UNIRME A UN GRUPO</DialogTitle>
              <DialogDescription className="font-body">
                Busca un grupo por nombre o usa un enlace de invitación.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!selectedGroup && (
                <div className="space-y-2">
                  <Label className="font-body text-sm">Buscar grupo por nombre</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Escribe para buscar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {search.trim() && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                      {filtered.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground font-body text-center">No se encontraron grupos</p>
                      ) : (
                        filtered.map((g) => (
                          <button
                            key={g.id}
                            className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => { setSelectedGroupId(g.id); setSearch(""); }}
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-display text-primary shrink-0">
                              {g.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold font-body text-foreground truncate">{g.name}</p>
                              {g.access_code && <Lock className="w-3 h-3 text-muted-foreground inline-block ml-1" />}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedGroup && (
                <div className="space-y-4">
                  <div className="rounded-xl border p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display text-primary shrink-0">
                        {selectedGroup.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold font-body text-foreground">{selectedGroup.name}</p>
                        {selectedGroup.description && (
                          <p className="text-xs text-muted-foreground font-body line-clamp-2">{selectedGroup.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                      <Users className="w-3.5 h-3.5" />
                      <span>{memberCount} / {selectedGroup.max_members === 999 ? "∞" : selectedGroup.max_members} miembros</span>
                    </div>
                  </div>

                  {!preSelectedGroupId && (
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedGroupId(null)}>
                      ← Buscar otro grupo
                    </Button>
                  )}

                  {selectedGroup.access_code && (
                    <div className="space-y-2">
                      <Label className="font-body text-sm">Código de acceso</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Ingresa el código"
                          value={accessCode}
                          onChange={(e) => { setAccessCode(e.target.value); setError(""); }}
                          className="pl-10"
                          maxLength={8}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive font-body">{error}</p>
                  )}

                  <Button className="w-full h-11" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {submitting ? "Enviando..." : "Solicitar unirme"}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JoinGroupModal;
