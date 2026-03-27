import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import JoinGroupModal from "@/components/groups/JoinGroupModal";

const JoinGroup = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/register?redirect=/join/${groupId}${code ? `?code=${code}` : ""}`, { replace: true });
      return;
    }
    setModalOpen(true);
  }, [user, loading, groupId, code, navigate]);

  if (loading) {
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
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-body mt-4">Cargando grupo...</p>
      </div>
      <Footer />
      <JoinGroupModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) navigate("/groups", { replace: true });
        }}
        preSelectedGroupId={groupId}
        preFilledCode={code}
      />
    </div>
  );
};

export default JoinGroup;
