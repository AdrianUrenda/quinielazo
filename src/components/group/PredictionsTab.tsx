import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Lock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  groupId: string;
  userId: string;
}

const PredictionsTab = ({ groupId, userId }: Props) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  const { data: matches, isLoading: loadingMatches } = useQuery({
    queryKey: ["matches-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "upcoming")
        .order("kickoff_utc", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: predictions } = useQuery({
    queryKey: ["predictions", groupId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const predictionMap = new Map(predictions?.map((p) => [p.match_id, p]));

  const savePrediction = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: string; home: number; away: number }) => {
      const existing = predictionMap.get(matchId);
      if (existing) {
        const { error } = await supabase
          .from("predictions")
          .update({ predicted_home_score: home, predicted_away_score: away, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("predictions").insert({
          match_id: matchId,
          group_id: groupId,
          user_id: userId,
          predicted_home_score: home,
          predicted_away_score: away,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["predictions", groupId, userId] });
      toast.success("Predicción guardada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = (matchId: string) => {
    const s = scores[matchId];
    if (!s || s.home === "" || s.away === "") {
      toast.error("Ingresa ambos marcadores");
      return;
    }
    savePrediction.mutate({ matchId, home: parseInt(s.home), away: parseInt(s.away) });
  };

  const getScore = (matchId: string, side: "home" | "away") => {
    if (scores[matchId]?.[side] !== undefined) return scores[matchId][side];
    const pred = predictionMap.get(matchId);
    if (pred) return side === "home" ? String(pred.predicted_home_score) : String(pred.predicted_away_score);
    return "";
  };

  const setScore = (matchId: string, side: "home" | "away", value: string) => {
    if (value !== "" && !/^\d{1,2}$/.test(value)) return;
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], home: prev[matchId]?.home ?? "", away: prev[matchId]?.away ?? "", [side]: value },
    }));
  };

  if (loadingMatches) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!matches?.length) return <p className="text-center text-muted-foreground py-12 font-body">No hay partidos próximos.</p>;

  return (
    <div className="space-y-3">
      {matches.map((match, i) => {
        const hasPrediction = predictionMap.has(match.id);
        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card-elevated rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display tracking-wider text-primary">
                {match.group_label ? `Grupo ${match.group_label}` : match.stage} · M{match.match_number}
              </span>
              <span className="text-xs text-muted-foreground font-body">
                {format(new Date(match.kickoff_utc), "d MMM · HH:mm", { locale: es })}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="flex-1 text-right text-sm font-body font-semibold text-foreground truncate">
                {match.home_flag} {match.home_team}
              </span>
              <Input
                className="w-12 h-9 text-center font-display text-lg p-0"
                value={getScore(match.id, "home")}
                onChange={(e) => setScore(match.id, "home", e.target.value)}
                placeholder="-"
              />
              <span className="text-muted-foreground font-display">:</span>
              <Input
                className="w-12 h-9 text-center font-display text-lg p-0"
                value={getScore(match.id, "away")}
                onChange={(e) => setScore(match.id, "away", e.target.value)}
                placeholder="-"
              />
              <span className="flex-1 text-left text-sm font-body font-semibold text-foreground truncate">
                {match.away_team} {match.away_flag}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                <MapPin className="w-3 h-3" />
                {match.stadium}
              </div>
              <Button
                size="sm"
                variant={hasPrediction ? "outline" : "default"}
                onClick={() => handleSave(match.id)}
                disabled={savePrediction.isPending}
                className="h-7 text-xs gap-1"
              >
                {hasPrediction ? <><Check className="w-3 h-3" /> Actualizar</> : "Guardar"}
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PredictionsTab;
