/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Eye, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { liveStatuses, finalStatuses } from "@/lib/matchCalendar";

type PublicProfile = { id: string; display_name: string; avatar_url: string | null };

interface Props {
  currentUserId: string;
}

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo ? <img src={logo} alt={`Escudo de ${name}`} className="h-6 w-6 rounded-full object-contain" loading="lazy" /> : null;

const getDemoStageLabel = (round?: string | null) => {
  const value = (round || "").toLowerCase();
  if (value.includes("reclas") || value.includes("relegation round")) return "Reclasificación";
  if (value.includes("quarter") || value.includes("cuarto")) return "Cuartos de Final";
  if (value.includes("semi")) return "Semifinales";
  if (value.includes("final")) return "Final";
  return round || "Liguilla";
};

const DemoLiveTab = ({ currentUserId }: Props) => {
  const queryClient = useQueryClient();
  const { data: matches } = useQuery({
    queryKey: ["demo-live-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demo_matches").select("*").order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 60_000,
  });

  const liveMatches = useMemo(
    () =>
      (matches || []).filter((m) => {
        const detail = m.status_detail || "";
        if (m.status === "finished" || finalStatuses.has(detail)) return false;
        return m.status === "live" || liveStatuses.has(detail);
      }),
    [matches],
  );

  const { data: approvedMembers } = useQuery({
    queryKey: ["demo-live-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("demo_group_members").select("user_id");
      if (error) throw error;
      const ids = (data || []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("public_profiles" as any)
        .select("id, display_name, avatar_url")
        .in("id", ids) as unknown as { data: PublicProfile[] | null };
      return profiles || [];
    },
  });

  const matchIds = liveMatches.map((m) => m.id);

  const { data: predictions } = useQuery({
    queryKey: ["demo-live-predictions", matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const { data, error } = await supabase.from("demo_predictions").select("*").in("demo_match_id", matchIds);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: matchIds.length > 0,
    refetchInterval: 60_000,
  });

  const predsByMatch = useMemo(() => {
    const map = new Map<string, any[]>();
    (predictions || []).forEach((p) => {
      const arr = map.get(p.demo_match_id) || [];
      arr.push(p);
      map.set(p.demo_match_id, arr);
    });
    return map;
  }, [predictions]);

  const memberMap = useMemo(() => new Map((approvedMembers || []).map((p) => [p.id, p])), [approvedMembers]);

  const handleShowPredictions = async () => {
    await queryClient.invalidateQueries({ queryKey: ["demo-live-matches"] });
    await queryClient.invalidateQueries({ queryKey: ["demo-live-predictions"] });
    const refreshed = (queryClient.getQueryData<any[]>(["demo-live-matches"]) || []).filter((m) => {
      const detail = m.status_detail || "";
      if (m.status === "finished" || finalStatuses.has(detail)) return false;
      return m.status === "live" || liveStatuses.has(detail);
    });
    if (refreshed.length === 0) toast.info("No hay partidos en curso por ahora.");
    else toast.success("Predicciones actualizadas");
  };

  const ShowPredictionsButton = (
    <Button variant="outline" size="sm" className="gap-2" onClick={handleShowPredictions}>
      <Eye className="h-3.5 w-3.5" />
      Mostrar predicciones
    </Button>
  );

  if (liveMatches.length === 0) {
    return (
      <div className="card-elevated rounded-2xl p-10 text-center space-y-4">
        <Radio className="w-12 h-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-display text-foreground">NO HAY PARTIDOS EN VIVO</h3>
        <p className="text-sm text-muted-foreground font-body">
          Cuando comience un partido podrás ver aquí las predicciones del resto del grupo.
        </p>
        <div className="flex justify-center">{ShowPredictionsButton}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
          </span>
          <span className="text-xs font-display tracking-wider text-destructive">
            {liveMatches.length} {liveMatches.length === 1 ? "PARTIDO EN CURSO" : "PARTIDOS EN CURSO"}
          </span>
        </div>
        {ShowPredictionsButton}
      </div>

      {liveMatches.map((match, idx) => {
        const matchPreds = predsByMatch.get(match.id) || [];
        const sorted = [...matchPreds].sort((a, b) => {
          if (a.user_id === currentUserId) return -1;
          if (b.user_id === currentUserId) return 1;
          return 0;
        });

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="card-elevated rounded-2xl p-5 border-destructive/20"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span className="truncate text-xs font-display tracking-wider text-primary">
                  {getDemoStageLabel(match.round_label)}{match.leg_label ? ` · ${match.leg_label}` : ""}
                </span>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px] border-destructive/40 text-destructive bg-destructive/5">
                EN VIVO
              </Badge>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 mb-4">
              <span className="flex min-w-0 items-center justify-end gap-2 text-right font-body font-semibold text-foreground text-sm sm:text-base">
                <span className="truncate">{match.home_team}</span>
                <TeamLogo logo={match.home_team_logo} name={match.home_team} />
              </span>
              <span className="font-display text-base sm:text-lg text-muted-foreground tabular-nums px-2">vs</span>
              <span className="flex min-w-0 items-center justify-start gap-2 text-left font-body font-semibold text-foreground text-sm sm:text-base">
                <TeamLogo logo={match.away_team_logo} name={match.away_team} />
                <span className="truncate">{match.away_team}</span>
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <h4 className="text-[11px] font-display tracking-wider text-muted-foreground mb-2">
                PREDICCIONES DEL GRUPO ({sorted.length})
              </h4>
              {sorted.length === 0 ? (
                <p className="text-xs text-muted-foreground font-body py-2">Ningún miembro registró predicción para este partido.</p>
              ) : (
                <div className="space-y-1.5">
                  {sorted.map((p) => {
                    const profile = memberMap.get(p.user_id);
                    const isMe = p.user_id === currentUserId;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${isMe ? "bg-primary/5 border border-primary/20" : "bg-muted/40"}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-display text-muted-foreground overflow-hidden shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (profile?.display_name || "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-body text-foreground truncate flex-1">
                          {profile?.display_name || "Miembro"}{isMe && " (tú)"}
                        </span>
                        <span className="font-display text-sm text-foreground tabular-nums shrink-0">
                          {p.predicted_home_score} - {p.predicted_away_score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DemoLiveTab;
