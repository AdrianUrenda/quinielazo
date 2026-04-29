/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { finalStatuses, formatMexicoDateTime, getGroup, getStage, getStageLabel, getStatusBadge } from "@/lib/matchCalendar";

interface Props {
  groupId: string;
  memberId: string;
  memberName: string;
  onBack: () => void;
}

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo ? <img src={logo} alt={`Escudo de ${name}`} className="h-5 w-5 rounded-full object-contain" loading="lazy" /> : null;

const PointsBadge = ({ points }: { points?: number | null }) => {
  if (points === 3) return <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">¡Exacto! +3 pts</Badge>;
  if (points === 1) return <Badge className="border-secondary/20 bg-secondary/10 text-[10px] text-secondary-foreground">Resultado +1 pt</Badge>;
  if (points === 0) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">0 pts</Badge>;
  return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Pendiente</Badge>;
};

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
      return (data || []) as any[];
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
      return (data || []) as any[];
    },
  });

  const predictionMap = useMemo(() => new Map(predictions?.map((p) => [p.match_id, p])), [predictions]);

  if (loadingPredictions) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  const matchesWithPredictions = matches?.filter((m) => predictionMap.has(m.id)) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Button>
        <h3 className="text-sm font-display tracking-wider text-foreground">PREDICCIONES DE {memberName.toUpperCase()}</h3>
      </div>

      {matchesWithPredictions.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 font-body">{memberName} aún no ha registrado predicciones.</p>
      ) : (
        <div className="space-y-3">
          {matchesWithPredictions.map((match, i) => {
            const pred = predictionMap.get(match.id)!;
            const statusDetail = match.status_detail || (match.status === "finished" ? "FT" : "NS");
            const badge = getStatusBadge(match.status, statusDetail);
            const group = getGroup(match.round_label, match.group_label);
            const hasFinalScore = (match.status === "finished" || finalStatuses.has(statusDetail)) && match.home_score !== null && match.away_score !== null;
            return (
              <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated rounded-xl p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {getStage(match.round_label, match.stage) !== "group" && <Trophy className="h-3 w-3 shrink-0 text-gold" />}
                    <span className="truncate text-xs font-display tracking-wider text-primary">{group ? `Grupo ${group}` : getStageLabel(match.round_label, match.stage)}</span>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>{badge.text}</Badge>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 mb-3">
                  <span className="flex min-w-0 items-center justify-end gap-2 text-right font-body font-semibold text-foreground text-sm sm:text-base">
                    <span className="truncate">{match.home_team}</span>
                    <TeamLogo logo={match.home_team_logo} name={match.home_team} />
                  </span>
                  <div className="text-center">
                    {hasFinalScore ? (
                      <span className="font-display text-2xl text-foreground sm:text-3xl">{match.home_score} – {match.away_score}</span>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-display text-muted-foreground">{formatMexicoDateTime(match.kickoff_utc)}</span>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground font-body">Predicción: {pred.predicted_home_score} - {pred.predicted_away_score}</p>
                  </div>
                  <span className="flex min-w-0 items-center justify-start gap-2 text-left font-body font-semibold text-foreground text-sm sm:text-base">
                    <TeamLogo logo={match.away_team_logo} name={match.away_team} />
                    <span className="truncate">{match.away_team}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground font-body">
                  <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{match.stadium || "Sede por confirmar"}{match.city ? `, ${match.city}` : ""}</span>
                  {hasFinalScore && <PointsBadge points={pred.points_awarded} />}
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
