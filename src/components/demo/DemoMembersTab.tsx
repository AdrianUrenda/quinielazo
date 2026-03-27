import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onViewPredictions: (userId: string, displayName: string) => void;
}

const DemoMembersTab = ({ onViewPredictions }: Props) => {
  const { data: members, isLoading } = useQuery({
    queryKey: ["demo-members-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_group_members")
        .select("*")
        .order("joined_at", { ascending: true });
      if (error) throw error;

      const userIds = data.map((m) => m.user_id);
      if (!userIds.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));
      return data.map((m) => ({ ...m, profile: profileMap.get(m.user_id) }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!members?.length) {
    return <p className="text-center text-muted-foreground py-12 font-body">No hay miembros en el grupo demo.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-display tracking-wider text-primary">MIEMBROS ({members.length})</h3>
      </div>
      <div className="space-y-2">
        {members.map((m, i) => {
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
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground font-body truncate">{m.profile?.email}</p>
              </div>
              <Badge variant="default" className="text-[10px] shrink-0">Miembro</Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
                onClick={() => onViewPredictions(m.user_id, displayName)}
              >
                <Eye className="w-3.5 h-3.5" /> Ver predicciones
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DemoMembersTab;
