import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  groupId: string;
  memberId: string;
  memberName: string;
  onBack: () => void;
}

const MemberPredictionsView = ({ groupId, memberId, memberName, onBack }: Props) => {
  const { data: predictions, isLoading: loadingPredictions } = useQuery({
    queryKey: ["member-predictions", groupId, memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", memberId);
      if (error) throw error;
      return data;
    },
  });

  const { data: matches } = useQuery({
    queryKey: ["all-matches-for-predictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const predictionMap = new Map(predictions?.map((p) => [p.match_id, p]));

  if (loadingPredictions) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // Only show matches that have predictions
  const matchesWithPredictions = matches?.filter((m) => predictionMap.has(m.id)) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <h3 className="text-sm font-display tracking-wider text-foreground">
          PREDICCIONES DE {memberName.toUpperCase()}
        </h3>
      </div>

      {matchesWithPredictions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 font-body">
          {memberName} aún no ha registrado predicciones.
        </p>
      ) : (
        <div className="space-y-3">
          {matchesWithPredictions.map((match, i) => {
            const pred = predictionMap.get(match.id)!;
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
                  <div className="w-12 h-9 rounded-md border border-input bg-muted/50 flex items-center justify-center font-display text-lg text-foreground">
                    {pred.predicted_home_score}
                  </div>
                  <span className="text-muted-foreground font-display">:</span>
                  <div className="w-12 h-9 rounded-md border border-input bg-muted/50 flex items-center justify-center font-display text-lg text-foreground">
                    {pred.predicted_away_score}
                  </div>
                  <span className="flex-1 text-left text-sm font-body font-semibold text-foreground truncate">
                    {match.away_team} {match.away_flag}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                    <MapPin className="w-3 h-3" />
                    {match.stadium}
                  </div>
                  {pred.points_awarded !== null && pred.points_awarded !== undefined && pred.points_awarded > 0 && (
                    <Badge variant="default" className="text-[10px]">
                      +{pred.points_awarded} pts
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemberPredictionsView;
