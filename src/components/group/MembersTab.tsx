import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, UserX, Clock, ShieldCheck, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  groupId: string;
  isAdmin: boolean;
  onViewPredictions: (userId: string, displayName: string) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  approved: { label: "Aprobado", variant: "default" },
  pending: { label: "Pendiente", variant: "secondary" },
  rejected: { label: "Rechazado", variant: "destructive" },
  removed: { label: "Removido", variant: "outline" },
};

const MembersTab = ({ groupId, isAdmin, onViewPredictions }: Props) => {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .order("joined_at", { ascending: true });
      if (error) throw error;

      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      return data.map((m) => ({ ...m, profile: profileMap.get(m.user_id) }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ memberId, userId, status }: { memberId: string; userId: string; status: string }) => {
      const { error } = await supabase
        .from("group_members")
        .update({ status: status as any })
        .eq("id", memberId);
      if (error) throw error;

      const { data: groupData } = await supabase.from("groups").select("name").eq("id", groupId).single();
      const groupName = groupData?.name || "el grupo";
      if (status === "approved") {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "join_approved" as any,
          message: `Tu solicitud para unirte a ${groupName} fue aprobada. ¡Ya puedes participar!`,
          metadata: { group_id: groupId },
        });
      } else if (status === "rejected") {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "join_rejected" as any,
          message: `Tu solicitud para unirte a ${groupName} no fue aprobada.`,
          metadata: { group_id: groupId },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast.success("Miembro actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!members?.length) return <p className="text-center text-muted-foreground py-12 font-body">No hay miembros en este grupo.</p>;

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");
  const others = members.filter((m) => m.status !== "pending" && m.status !== "approved");

  const renderMember = (m: (typeof members)[0], i: number) => {
    const sc = statusConfig[m.status] || statusConfig.approved;
    const displayName = m.profile?.display_name || "Sin nombre";
    return (
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        className="flex items-center gap-3 rounded-xl p-3 card-elevated"
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-display text-muted-foreground overflow-hidden shrink-0">
          {m.profile?.avatar_url ? (
            <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (m.profile?.display_name || "?").charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold text-foreground truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground font-body truncate">{m.profile?.email}</p>
        </div>
        <Badge variant={sc.variant} className="text-[10px] shrink-0">{sc.label}</Badge>
        {m.status === "approved" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => onViewPredictions(m.user_id, displayName)}
          >
            <Eye className="w-3.5 h-3.5" /> Ver predicciones
          </Button>
        )}
        {isAdmin && m.status === "pending" && (
          <div className="flex gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => updateStatus.mutate({ memberId: m.id, userId: m.user_id, status: "approved" })}>
              <CheckCircle className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateStatus.mutate({ memberId: m.id, userId: m.user_id, status: "rejected" })}>
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
        {isAdmin && m.status === "approved" && (
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground shrink-0" onClick={() => updateStatus.mutate({ memberId: m.id, userId: m.user_id, status: "removed" })}>
            <UserX className="w-4 h-4" />
          </Button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-display tracking-wider text-secondary">SOLICITUDES PENDIENTES ({pending.length})</h3>
          </div>
          <div className="space-y-2">{pending.map(renderMember)}</div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display tracking-wider text-primary">MIEMBROS ({approved.length})</h3>
        </div>
        <div className="space-y-2">{approved.map(renderMember)}</div>
      </div>
      {others.length > 0 && (
        <div>
          <h3 className="text-xs font-display tracking-wider text-muted-foreground mb-2">OTROS ({others.length})</h3>
          <div className="space-y-2">{others.map(renderMember)}</div>
        </div>
      )}
    </div>
  );
};

export default MembersTab;
