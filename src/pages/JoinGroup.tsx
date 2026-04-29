import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import JoinGroupModal from "@/components/groups/JoinGroupModal";

const JoinGroup = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const { loading } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: invitedGroup, isLoading: groupLoading } = useQuery({
    queryKey: ["group-invite", inviteCode],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_group_by_invite_code" as any, {
        _invite_code: inviteCode!,
      });
      if (error) throw error;
      return Array.isArray(data) ? data[0] ?? null : data;
    },
    enabled: !!inviteCode,
  });

  useEffect(() => {
    if (!loading && !groupLoading && invitedGroup) setModalOpen(true);
  }, [loading, groupLoading, invitedGroup]);

  if (loading || groupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container text-center">
        {invitedGroup ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground font-body mt-4">Cargando invitación...</p>
          </>
        ) : (
          <div className="card-elevated rounded-2xl p-8 max-w-md mx-auto space-y-4">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-display text-foreground tracking-wide">INVITACIÓN NO ENCONTRADA</h1>
            <p className="text-sm text-muted-foreground font-body">El enlace no existe o ya no está disponible.</p>
            <Button onClick={() => navigate("/groups")}>Ir a mis grupos</Button>
          </div>
        )}
      </div>
      <Footer />
      {invitedGroup && (
        <JoinGroupModal
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) navigate("/groups", { replace: true });
          }}
          preSelectedGroup={invitedGroup as any}
          preFilledCode={code}
        />
      )}
    </div>
  );
};

export default JoinGroup;
