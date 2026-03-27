import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, Users, Loader2, Trophy } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import JoinGroupModal from "@/components/groups/JoinGroupModal";
import { motion } from "framer-motion";

const statusBadge = (isAdmin: boolean, status: string) => {
  if (isAdmin) return { label: "Admin", className: "bg-primary/10 text-primary border-primary/20" };
  if (status === "approved") return { label: "Miembro", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
  if (status === "pending") return { label: "En espera de aprobación", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
  return { label: status, className: "" };
};

const MyGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["my-groups", user?.id],
    queryFn: async () => {
      // Get memberships
      const { data: memberships, error } = await supabase
        .from("group_members")
        .select("group_id, status")
        .eq("user_id", user!.id)
        .in("status", ["approved", "pending"]);
      if (error) throw error;

      if (!memberships.length) return [];

      const groupIds = memberships.map((m) => m.group_id);
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name, description, admin_user_id")
        .in("id", groupIds);

      return (groupsData || []).map((g) => {
        const membership = memberships.find((m) => m.group_id === g.id);
        return {
          ...g,
          status: membership?.status || "pending",
          isAdmin: g.admin_user_id === user!.id,
        };
      });
    },
    enabled: !!user,
  });

  const CTAs = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button onClick={() => setShowCreate(true)} className="h-11">
        <Plus className="w-4 h-4 mr-2" /> Crear grupo
      </Button>
      <Button variant="outline" onClick={() => setShowJoin(true)} className="h-11">
        <UserPlus className="w-4 h-4 mr-2" /> Unirme a un grupo
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h1 className="text-4xl font-display text-foreground tracking-wide">MIS GRUPOS</h1>
            <CTAs />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !groups?.length ? (
            <div className="card-elevated rounded-2xl p-10 text-center space-y-6">
              <Trophy className="w-14 h-14 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-xl font-display text-foreground tracking-wide mb-2">AÚN NO TIENES GRUPOS</h2>
                <p className="text-sm text-muted-foreground font-body">
                  Crea un grupo o únete a uno para empezar a hacer tus predicciones del Mundial 2026.
                </p>
              </div>
              <CTAs />
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((g, i) => {
                const badge = statusBadge(g.isAdmin, g.status);
                const canView = g.isAdmin || g.status === "approved";
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="card-elevated rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-display text-primary shrink-0">
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold font-body text-foreground truncate">{g.name}</p>
                      {g.description && (
                        <p className="text-xs text-muted-foreground font-body truncate">{g.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    {canView && (
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/group/${g.id}`)}>
                        Ver grupo
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />

      <CreateGroupModal open={showCreate} onOpenChange={setShowCreate} />
      <JoinGroupModal open={showJoin} onOpenChange={setShowJoin} />
    </div>
  );
};

export default MyGroups;
