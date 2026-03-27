import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, BarChart3, ClipboardList, ArrowLeft, Copy, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PredictionsTab from "@/components/group/PredictionsTab";
import LeaderboardTab from "@/components/group/LeaderboardTab";
import MembersTab from "@/components/group/MembersTab";
import MemberPredictionsView from "@/components/group/MemberPredictionsView";

const tierLabels: Record<string, string> = {
  basico: "Básico",
  familiar: "Familiar",
  grande: "Grande",
};

const GroupDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [viewingMember, setViewingMember] = useState<{ id: string; name: string } | null>(null);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("groups").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const isAdmin = group?.admin_user_id === user?.id;
  const isApproved = membership?.status === "approved";

  const copyInviteCode = () => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast.success("Código copiado al portapapeles");
    }
  };

  if (authLoading || groupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container text-center">
          <h1 className="text-4xl font-display text-foreground">Grupo no encontrado</h1>
          <Button asChild className="mt-4"><Link to="/">Volver al inicio</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>

            <div className="card-elevated rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-wide">{group.name}</h1>
                  {group.description && <p className="text-sm text-muted-foreground font-body mt-1">{group.description}</p>}
                </div>
                <Badge variant="secondary" className="font-display text-xs shrink-0">{tierLabels[group.tier] || group.tier}</Badge>
              </div>

              {isAdmin && group.invite_code && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground font-body">Código de invitación:</span>
                  <code className="font-mono text-sm text-foreground font-semibold">{group.invite_code}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyInviteCode}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {!isApproved && !isAdmin ? (
            <div className="card-elevated rounded-2xl p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-display text-foreground mb-2">ACCESO RESTRINGIDO</h2>
              <p className="text-sm text-muted-foreground font-body">
                {membership?.status === "pending"
                  ? "Tu solicitud está pendiente de aprobación por el administrador."
                  : "Necesitas ser miembro aprobado para ver el contenido de este grupo."}
              </p>
            </div>
          ) : (
            <Tabs defaultValue="predictions" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="predictions" className="font-display tracking-wider text-xs gap-1.5">
                  <ClipboardList className="w-4 h-4" /> PREDICCIONES
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="font-display tracking-wider text-xs gap-1.5">
                  <BarChart3 className="w-4 h-4" /> POSICIONES
                </TabsTrigger>
                <TabsTrigger value="members" className="font-display tracking-wider text-xs gap-1.5">
                  <Users className="w-4 h-4" /> MIEMBROS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="predictions">
                <PredictionsTab groupId={group.id} userId={user.id} />
              </TabsContent>

              <TabsContent value="leaderboard">
                <LeaderboardTab groupId={group.id} currentUserId={user.id} />
              </TabsContent>

              <TabsContent value="members">
                {viewingMember ? (
                  <MemberPredictionsView
                    groupId={group.id}
                    memberId={viewingMember.id}
                    memberName={viewingMember.name}
                    onBack={() => setViewingMember(null)}
                  />
                ) : (
                  <MembersTab
                    groupId={group.id}
                    isAdmin={isAdmin}
                    onViewPredictions={(userId, displayName) => setViewingMember({ id: userId, name: displayName })}
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GroupDashboard;
