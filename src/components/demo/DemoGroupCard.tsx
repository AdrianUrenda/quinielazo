import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  userId: string;
}

const DemoGroupCard = ({ userId }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: membership, isLoading } = useQuery({
    queryKey: ["demo-membership", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("demo_group_members")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("demo_group_members").insert({ user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-membership", userId] });
      toast.success("¡Te uniste al Grupo Demo!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isMember = !!membership;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated rounded-xl p-4 flex items-center gap-4 ring-1 ring-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent"
    >
      <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">
        ⚽
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold font-body text-foreground truncate">Grupo Demo — Liga MX</p>
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] shrink-0">
            DEMO
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-body truncate">
          Prueba predicciones con partidos reales de la Liga MX Clausura 2025
        </p>
      </div>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : isMember ? (
        <Button size="sm" variant="secondary" onClick={() => navigate("/demo")}>
          Ir al grupo
        </Button>
      ) : (
        <Button size="sm" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
          {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unirme"}
        </Button>
      )}
    </motion.div>
  );
};

export default DemoGroupCard;
