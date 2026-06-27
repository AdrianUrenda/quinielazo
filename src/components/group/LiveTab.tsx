/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, RefreshCw, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { liveStatuses, getGroup, getStage, getStageLabel, getStatusBadge } from "@/lib/matchCalendar";

type PublicProfile = { id: string; display_name: string; avatar_url: string | null };

interface Props {
  groupId: string;
  currentUserId: string;
}

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo ? <img src={logo} alt={`Escudo de ${name}`} className="h-6 w-6 rounded-full object-contain" loading="lazy" /> : null;

const PointsHint = ({ pred, home, away }: { pred: { predicted_home_score: number; predicted_away_score: number }; home: number | null; away: number | null }) => {
  if (home === null || away === null) return null;
  const exact = pred.predicted_home_score === home && pred.predicted_away_score === away;
  const predSign = Math.sign(pred.predicted_home_score - pred.predicted_away_score);
  const actualSign = Math.sign(home - away);
  if (exact) return <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">+3 pts en vivo</Badge>;
  if (predSign === actualSign) return <Badge className="border-secondary/20 bg-secondary/10 text-[10px] text-secondary-foreground">+1 pt en vivo</Badge>;
  return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">0 pts</Badge>;
};

const LiveTab = ({ groupId, currentUserId }: Props) => {
  const queryClient = useQueryClient();
  const { data: matches } = useQuery({
    queryKey: ["live-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 30_000,
  });

  const syncMatches = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("api-football-fixtures", {
        body: { action: "sync-matches" },
      });
      if (error) throw error;
      return data as { fixturesSynced?: number };
    },
    onSuccess: (data) => {
      toast.success(`Resultados actualizados: ${data.fixturesSynced ?? 0} partidos`);
      queryClient.invalidateQueries({ queryKey: ["live-matches"] });
      queryClient.invalidateQueries({ queryKey: ["live-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["matches-all-api-football"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", groupId] });
    },
    onError: () => toast.error("No pudimos actualizar API-Football. Intenta de nuevo."),
  });

  const liveMatches = useMemo(
    () =>
      (matches || []).filter((m) => {
        const detail = m.status_detail || "";
        return m.status === "live" || liveStatuses.has(detail);
      }),
    [matches],
  );

  const { data: approvedMembers } = useQuery({
    queryKey: ["live-approved-members", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("status", "approved");
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
    queryKey: ["live-predictions", groupId, matchIds.join(",")],
    queryFn: async () => {
      if (matchIds.length === 0) return [];
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("group_id", groupId)
        .in("match_id", matchIds);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: matchIds.length > 0,
    refetchInterval: 30_000,
  });

  const predsByMatch = useMemo(() => {
    const map = new Map<string, any[]>();
    (predictions || []).forEach((p) => {
      const arr = map.get(p.match_id) || [];
      arr.push(p);
      map.set(p.match_id, arr);
    });
    return map;
  }, [predictions]);

  const memberMap = useMemo(() => new Map((approvedMembers || []).map((p) => [p.id, p])), [approvedMembers]);

  if (liveMatches.length === 0) {
    return (
      <div className="card-elevated rounded-2xl p-10 text-center">
        <Radio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-display text-foreground mb-2">NO HAY PARTIDOS EN VIVO</h3>
        <p className="text-sm text-muted-foreground font-body">
          Vuelve cuando haya un partido en curso para seguir el marcador y las predicciones de tu grupo en tiempo real.
        </p>
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
            {liveMatches.length} {liveMatches.length === 1 ? "PARTIDO EN VIVO" : "PARTIDOS EN VIVO"} · ACTUALIZA CADA 30s
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => syncMatches.mutate()}
          disabled={syncMatches.isPending}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncMatches.isPending ? "animate-spin" : ""}`} />
          Actualizar resultados
        </Button>
      </div>

      {liveMatches.map((match, idx) => {
        const statusDetail = match.status_detail || "LIVE";
        const badge = getStatusBadge(match.status, statusDetail);
        const group = getGroup(match.round_label, match.group_label);
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
                {getStage(match.round_label, match.stage) !== "group" && <Trophy className="h-3.5 w-3.5 shrink-0 text-gold" />}
                <span className="truncate text-xs font-display tracking-wider text-primary">
                  {group ? `Grupo ${group}` : getStageLabel(match.round_label, match.stage)}
                </span>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>
                {badge.text}{statusDetail && statusDetail !== "LIVE" ? ` · ${statusDetail}` : ""}
              </Badge>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 mb-4">
              <span className="flex min-w-0 items-center justify-end gap-2 text-right font-body font-semibold text-foreground text-sm sm:text-base">
                <span className="truncate">{match.home_team}</span>
                <TeamLogo logo={match.home_team_logo} name={match.home_team} />
              </span>
              <span className="font-display text-3xl sm:text-4xl text-destructive tabular-nums">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </span>
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
                        <PointsHint pred={p} home={match.home_score} away={match.away_score} />
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

export default LiveTab;
