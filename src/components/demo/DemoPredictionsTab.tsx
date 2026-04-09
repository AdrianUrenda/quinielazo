import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lock, MapPin, Radio, Save } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  userId: string;
}

const DemoPredictionsTab = ({ userId }: Props) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  const { data: matches, isLoading } = useQuery({
    queryKey: ["demo-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_matches")
        .select("*")
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: predictions } = useQuery({
    queryKey: ["demo-predictions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_predictions")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    },
  });

  const predictionMap = new Map(predictions?.map((p: any) => [p.demo_match_id, p]));

  const savePrediction = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: string; home: number; away: number }) => {
      const existing = predictionMap.get(matchId);
      if (existing) {
        const { error } = await supabase
          .from("demo_predictions")
          .update({ predicted_home_score: home, predicted_away_score: away, submitted_at: new Date().toISOString() })
          .eq("id", (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("demo_predictions").insert({
          demo_match_id: matchId,
          user_id: userId,
          predicted_home_score: home,
          predicted_away_score: away,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demo-predictions", userId] });
      toast.success("Predicción guardada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSaveAll = async () => {
    const upcomingMatches = matches?.filter((m: any) => m.status === "upcoming" && new Date(m.kickoff_utc) > new Date()) ?? [];
    const toSave = upcomingMatches.filter((match: any) => {
      const s = scores[match.id];
      const pred = predictionMap.get(match.id) as any;
      if (s && s.home !== "" && s.away !== "") {
        if (pred) return s.home !== String(pred.predicted_home_score) || s.away !== String(pred.predicted_away_score);
        return true;
      }
      return false;
    });

    if (toSave.length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    let saved = 0;
    for (const match of toSave) {
      const s = scores[match.id];
      try {
        await savePrediction.mutateAsync({ matchId: match.id, home: parseInt(s.home), away: parseInt(s.away) });
        saved++;
      } catch { /* already toasted */ }
    }
    if (saved > 0) {
      queryClient.invalidateQueries({ queryKey: ["demo-predictions", userId] });
      toast.success(`${saved} predicción(es) guardada(s)`);
    }
  };

  const getScore = (matchId: string, side: "home" | "away") => {
    if (scores[matchId]?.[side] !== undefined) return scores[matchId][side];
    const pred = predictionMap.get(matchId) as any;
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

  const getPointsBadge = (pred: any, match: any) => {
    if (!pred) return <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">Sin predicción</Badge>;
    if (pred.points_awarded === null || pred.points_awarded === undefined) return null;
    if (pred.points_awarded === 3) return <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">¡Exacto! +3 pts</Badge>;
    if (pred.points_awarded === 1) return <Badge className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20">Resultado +1 pt</Badge>;
    return <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">Sin puntos</Badge>;
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;

  if (!matches?.length) return <p className="text-center text-muted-foreground py-12 font-body">No hay partidos cargados. Sincroniza los fixtures desde el panel de admin.</p>;

  const upcoming = matches.filter((m: any) => m.status === "upcoming");
  const live = matches.filter((m: any) => m.status === "live");
  const finished = matches.filter((m: any) => m.status === "finished");

  // Group upcoming by jornada
  const upcomingByJornada = upcoming.reduce((acc: Record<number, any[]>, m: any) => {
    const j = m.jornada || 0;
    if (!acc[j]) acc[j] = [];
    acc[j].push(m);
    return acc;
  }, {});
  const upcomingJornadas = Object.keys(upcomingByJornada).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Live matches */}
      {live.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-foreground tracking-wider mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" /> EN VIVO
          </h3>
          <div className="space-y-3">
            {live.map((match: any, i: number) => {
              const pred = predictionMap.get(match.id) as any;
              return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated rounded-xl p-4 ring-1 ring-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] animate-pulse">EN VIVO</Badge>
                    <span className="text-xs text-muted-foreground font-body">{format(new Date(match.kickoff_utc), "d MMM · HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex-1 text-right flex items-center justify-end gap-2">
                      {match.home_team_logo && <img src={match.home_team_logo} alt="" className="w-6 h-6" />}
                      <span className="text-sm font-body font-semibold text-foreground truncate">{match.home_team}</span>
                    </div>
                    <span className="font-display text-2xl text-foreground">{match.home_score ?? 0} - {match.away_score ?? 0}</span>
                    <div className="flex-1 text-left flex items-center gap-2">
                      <span className="text-sm font-body font-semibold text-foreground truncate">{match.away_team}</span>
                      {match.away_team_logo && <img src={match.away_team_logo} alt="" className="w-6 h-6" />}
                    </div>
                  </div>
                  {pred && (
                    <p className="text-xs text-muted-foreground text-center mt-2 font-body">
                      Tu predicción: {pred.predicted_home_score} - {pred.predicted_away_score}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      {upcomingJornadas.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-foreground tracking-wider mb-3">PRÓXIMOS PARTIDOS</h3>
          {upcomingJornadas.map((jornada) => (
            <div key={jornada} className="mb-4">
              <p className="text-xs font-display tracking-wider text-muted-foreground mb-2">JORNADA {jornada}</p>
              <div className="space-y-3">
                {upcomingByJornada[jornada].map((match: any, i: number) => {
                  const hasPrediction = predictionMap.has(match.id);
                  const kickoff = new Date(match.kickoff_utc);
                  const isLocked = kickoff <= new Date();

                  return (
                    <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-display tracking-wider text-primary">Liga MX</span>
                        <span className="text-xs text-muted-foreground font-body">{format(kickoff, "d MMM · HH:mm", { locale: es })}</span>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 text-right flex items-center justify-end gap-2">
                          {match.home_team_logo && <img src={match.home_team_logo} alt="" className="w-5 h-5" />}
                          <span className="text-sm font-body font-semibold text-foreground truncate">{match.home_team}</span>
                        </div>
                        {isLocked ? (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Lock className="w-3.5 h-3.5" />
                            <span className="text-xs font-body">Cerrada</span>
                          </div>
                        ) : (
                          <>
                            <Input className="w-12 h-9 text-center font-display text-lg p-0" value={getScore(match.id, "home")} onChange={(e) => setScore(match.id, "home", e.target.value)} placeholder="-" />
                            <span className="text-muted-foreground font-display">:</span>
                            <Input className="w-12 h-9 text-center font-display text-lg p-0" value={getScore(match.id, "away")} onChange={(e) => setScore(match.id, "away", e.target.value)} placeholder="-" />
                          </>
                        )}
                        <div className="flex-1 text-left flex items-center gap-2">
                          <span className="text-sm font-body font-semibold text-foreground truncate">{match.away_team}</span>
                          {match.away_team_logo && <img src={match.away_team_logo} alt="" className="w-5 h-5" />}
                        </div>
                      </div>

                      <div className="flex items-center mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
                          <MapPin className="w-3 h-3" />
                          {match.stadium}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Finished matches */}
      {finished.length > 0 && (
        <div>
          <h3 className="font-display text-lg text-foreground tracking-wider mb-3">PARTIDOS FINALIZADOS</h3>
          <div className="space-y-3">
            {finished.map((match: any, i: number) => {
              const pred = predictionMap.get(match.id) as any;
              return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-display tracking-wider text-muted-foreground">FINAL</span>
                    <span className="text-xs text-muted-foreground font-body">{format(new Date(match.kickoff_utc), "d MMM", { locale: es })}</span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <div className="flex-1 text-right flex items-center justify-end gap-2">
                      {match.home_team_logo && <img src={match.home_team_logo} alt="" className="w-5 h-5" />}
                      <span className="text-sm font-body font-semibold text-foreground truncate">{match.home_team}</span>
                    </div>
                    <span className="font-display text-2xl text-foreground">{match.home_score} - {match.away_score}</span>
                    <div className="flex-1 text-left flex items-center gap-2">
                      <span className="text-sm font-body font-semibold text-foreground truncate">{match.away_team}</span>
                      {match.away_team_logo && <img src={match.away_team_logo} alt="" className="w-5 h-5" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {pred ? (
                      <p className="text-xs text-muted-foreground font-body">
                        Tu predicción: {pred.predicted_home_score} - {pred.predicted_away_score}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground font-body">Sin predicción</p>
                    )}
                    {getPointsBadge(pred, match)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer for floating button */}
      <div className="h-16" />

      {/* Floating save button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="lg"
          onClick={handleSaveAll}
          disabled={savePrediction.isPending}
          className="px-8 shadow-lg gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar predicciones
        </Button>
      </div>
    </div>
};

export default DemoPredictionsTab;
