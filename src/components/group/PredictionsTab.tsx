/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ChevronDown, Filter, History, Lock, MapPin, Radio, RefreshCw, Save, Trophy } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  finalStatuses,
  liveStatuses,
  cancelledStatuses,
  stageFilters,
  groupFilters,
  formatMexicoDateKey,
  formatMexicoDateTime,
  formatMexicoDayHeader,
  formatMexicoTime,
  getGroup,
  getStage,
  getStageLabel,
  getStatusBadge,
} from "@/lib/matchCalendar";

interface Props {
  groupId: string;
  userId: string;
}

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo ? <img src={logo} alt={`Escudo de ${name}`} className="h-5 w-5 rounded-full object-contain" loading="lazy" /> : null;

const PredictionsTab = ({ groupId, userId }: Props) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [stageFilter, setStageFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: matches, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["matches-all-api-football"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchOnMount: "always",
    staleTime: 0,
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
      return (data || []) as any[];
    },
  });

  const { data: teamGroupMap } = useQuery({
    queryKey: ["team-group-map"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("api-football-fixtures", {
        body: { action: "team-groups" },
      });
      if (error) throw error;
      return ((data as any)?.teamGroupMap || {}) as Record<string, string>;
    },
    staleTime: 1000 * 60 * 60,
  });

  const predictionMap = useMemo(() => new Map(predictions?.map((p) => [p.match_id, p])), [predictions]);

  const syncMatches = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("api-football-fixtures", {
        body: { action: "sync-matches" },
      });
      if (error) throw error;
      return data as { fixturesSynced?: number; predictionsScored?: number; updatedAt?: string };
    },
    onSuccess: (data) => {
      toast.success(`Calendario actualizado: ${data.fixturesSynced ?? 0} partidos`);
      queryClient.invalidateQueries({ queryKey: ["matches-all-api-football"] });
      queryClient.invalidateQueries({ queryKey: ["predictions", groupId, userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", groupId] });
      queryClient.invalidateQueries({ queryKey: ["member-predictions"] });
    },
    onError: () => toast.error("No pudimos actualizar API-Football. Intenta de nuevo."),
  });

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
    onError: (err: Error) => toast.error(err.message),
  });

  const canPredict = (match: any) => match.status === "upcoming" && new Date(match.kickoff_utc).getTime() > Date.now();

  const filtered = useMemo(() => {
    return (matches || []).filter((match) => {
      if (stageFilter !== "all" && getStage(match.round_label, match.stage) !== stageFilter) return false;
      if (groupFilter !== "all" && getGroup(match.round_label, match.group_label, teamGroupMap, match.home_team, match.away_team) !== groupFilter) return false;
      return true;
    });
  }, [matches, stageFilter, groupFilter, teamGroupMap]);

  const groupedByDate = useMemo(() => {
    return filtered.reduce((acc: Record<string, any[]>, match) => {
      const key = formatMexicoDateKey(match.kickoff_utc);
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});
  }, [filtered]);

  const isDayPast = (dayMatches: any[]) =>
    dayMatches.every((m) => {
      const sd = m.status_detail || "";
      return m.status === "finished" || finalStatuses.has(sd) || cancelledStatuses.has(sd);
    });

  const { archivedDays, lastClosedDay, upcomingDays } = useMemo(() => {
    const entries = Object.entries(groupedByDate) as [string, any[]][];
    let splitIdx = 0;
    while (splitIdx < entries.length && isDayPast(entries[splitIdx][1])) splitIdx++;
    const pastEntries = entries.slice(0, splitIdx);
    const upcoming = entries.slice(splitIdx);
    const last = pastEntries.length > 0 ? pastEntries[pastEntries.length - 1] : null;
    const archived = pastEntries.slice(0, -1);
    return { archivedDays: archived, lastClosedDay: last, upcomingDays: upcoming };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedByDate]);

  const archivedMatchCount = useMemo(
    () => archivedDays.reduce((sum, [, ms]) => sum + (ms as any[]).length, 0),
    [archivedDays]
  );

  const lastUpdated = useMemo(() => {
    const latest = (matches || []).map((m) => m.last_synced_at).filter(Boolean).sort().at(-1);
    return latest ? formatMexicoTime(latest) : null;
  }, [matches]);

  const handleSaveAll = async () => {
    const toSave = (matches || []).filter((match) => {
      if (!canPredict(match)) return false;
      const s = scores[match.id];
      const pred = predictionMap.get(match.id);
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
      } catch {
        // Error already toasted
      }
    }
    if (saved > 0) {
      queryClient.invalidateQueries({ queryKey: ["predictions", groupId, userId] });
      toast.success(`${saved} predicción(es) guardada(s)`);
    }
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

  if (isLoading) return <CalendarSkeleton />;

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-card">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="font-display text-2xl tracking-wide text-foreground">NO SE PUDIERON CARGAR LOS PARTIDOS</h2>
            <p className="mt-1 text-sm text-muted-foreground">Intenta nuevamente. {error instanceof Error ? error.message : ""}</p>
          </div>
          <Button onClick={() => refetch()} className="gap-2"><RefreshCw className="h-4 w-4" /> Reintentar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card-elevated rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg tracking-wider text-foreground">CALENDARIO OFICIAL</p>
            <p className="text-xs text-muted-foreground font-body">
              {lastUpdated ? `Última actualización: ${lastUpdated} CDMX` : "Actualiza para sincronizar API-Football"}
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => syncMatches.mutate()} disabled={syncMatches.isPending || isFetching}>
            <RefreshCw className={`h-4 w-4 ${syncMatches.isPending ? "animate-spin" : ""}`} />
            Actualizar resultados
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {stageFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={stageFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStageFilter(filter.value);
              if (filter.value !== "group") setGroupFilter("all");
            }}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {(stageFilter === "all" || stageFilter === "group") && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {groupFilters.map((group) => (
            <Button key={group} variant={groupFilter === group ? "secondary" : "ghost"} size="sm" onClick={() => setGroupFilter(group)} className="h-7 px-2.5 text-xs">
              {group === "all" ? "Todos" : `Grupo ${group}`}
            </Button>
          ))}
        </div>
      )}

      {Object.keys(groupedByDate).length === 0 ? (
        <div className="py-16 text-center text-muted-foreground font-body">
          <Filter className="mx-auto mb-3 h-8 w-8 opacity-50" />
          <p>No se encontraron partidos con estos filtros.</p>
        </div>
      ) : (
        <>
          {archivedDays.length > 0 && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card"
                >
                  <span className="flex items-center gap-2 text-sm font-display tracking-wider uppercase text-muted-foreground">
                    <History className="h-4 w-4" />
                    Partidos anteriores ({archivedMatchCount})
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                {archivedDays.map(([dateKey, dayMatches]) => (
                  <DaySection
                    key={dateKey}
                    dateKey={dateKey}
                    dayMatches={dayMatches}
                    predictionMap={predictionMap}
                    canPredict={canPredict}
                    getScore={getScore}
                    setScore={setScore}
                    teamGroupMap={teamGroupMap}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {lastClosedDay && (
            <DaySection
              dateKey={lastClosedDay[0]}
              dayMatches={lastClosedDay[1]}
              predictionMap={predictionMap}
              canPredict={canPredict}
              getScore={getScore}
              setScore={setScore}
              teamGroupMap={teamGroupMap}
            />
          )}

          {upcomingDays.length > 0 && (
            <div>
              {(archivedDays.length > 0 || lastClosedDay) && (
                <div className="mb-3 mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-display tracking-wider uppercase text-primary">Próximos partidos</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              {upcomingDays.map(([dateKey, dayMatches]) => (
                <DaySection
                  key={dateKey}
                  dateKey={dateKey}
                  dayMatches={dayMatches}
                  predictionMap={predictionMap}
                  canPredict={canPredict}
                  getScore={getScore}
                  setScore={setScore}
                  teamGroupMap={teamGroupMap}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-16" />
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <Button size="lg" onClick={handleSaveAll} disabled={savePrediction.isPending} className="gap-2 px-8 shadow-lg">
          <Save className="h-4 w-4" />
          Guardar predicciones
        </Button>
      </div>
    </div>
  );
};

const CalendarSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="card-elevated rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-5 w-20" /></div>
        <Skeleton className="mx-auto mb-3 h-7 w-4/5" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
    ))}
  </div>
);

const PointsBadge = ({ pred }: { pred?: any }) => {
  if (!pred) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Sin predicción</Badge>;
  if (pred.points_awarded === 3) return <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">¡Exacto! +3 pts</Badge>;
  if (pred.points_awarded === 1) return <Badge className="border-secondary/20 bg-secondary/10 text-[10px] text-secondary-foreground">Resultado +1 pt</Badge>;
  if (pred.points_awarded === 0) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">0 pts</Badge>;
  return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Pendiente</Badge>;
};

const PredictionMatchCard = ({ match, index, pred, canPredict, getScore, setScore, teamGroupMap }: any) => {
  const statusDetail = match.status_detail || (match.status === "finished" ? "FT" : "NS");
  const badge = getStatusBadge(match.status, statusDetail);
  const group = getGroup(match.round_label, match.group_label, teamGroupMap, match.home_team, match.away_team);
  const homeName = match.home_team || "TBD";
  const awayName = match.away_team || "TBD";
  const hasFinalScore = (match.status === "finished" || finalStatuses.has(statusDetail)) && match.home_score !== null && match.away_score !== null;
  const isLive = match.status === "live" || liveStatuses.has(statusDetail);
  const isCancelled = cancelledStatuses.has(statusDetail);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card-elevated rounded-xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {getStage(match.round_label, match.stage) !== "group" && <Trophy className="h-3 w-3 shrink-0 text-gold" />}
          <span className="truncate text-xs font-display tracking-wider text-primary">
            {group ? `Grupo ${group}` : getStageLabel(match.round_label, match.stage)}
          </span>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>{badge.text}</Badge>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 mb-3">
        <span className="flex min-w-0 items-center justify-end gap-2 text-right font-body font-semibold text-foreground text-sm sm:text-base">
          <span className="truncate">{homeName}</span>
          <TeamLogo logo={match.home_team_logo} name={homeName} />
        </span>

        {hasFinalScore ? (
          <span className="shrink-0 px-2 font-display text-2xl text-foreground sm:text-3xl">{match.home_score} – {match.away_score}</span>
        ) : isLive ? (
          <Badge className="border-destructive/20 bg-destructive/10 text-destructive"><Radio className="mr-1 h-3 w-3 animate-pulse" /> En curso</Badge>
        ) : canPredict ? (
          <div className="flex shrink-0 items-center gap-1">
            <Input className="h-9 w-12 p-0 text-center font-display text-lg" value={getScore(match.id, "home")} onChange={(e) => setScore(match.id, "home", e.target.value)} placeholder="-" />
            <span className="font-display text-muted-foreground">:</span>
            <Input className="h-9 w-12 p-0 text-center font-display text-lg" value={getScore(match.id, "away")} onChange={(e) => setScore(match.id, "away", e.target.value)} placeholder="-" />
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span className="text-xs font-body">Cerrada</span></div>
        )}

        <span className="flex min-w-0 items-center justify-start gap-2 text-left font-body font-semibold text-foreground text-sm sm:text-base">
          <TeamLogo logo={match.away_team_logo} name={awayName} />
          <span className="truncate">{awayName}</span>
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-body sm:flex-row">
        {!hasFinalScore && !isLive && !isCancelled && <span>{formatMexicoDateTime(match.kickoff_utc)}</span>}
        {(match.stadium || match.city) && <span className="flex items-center gap-1 text-center"><MapPin className="h-3 w-3 shrink-0" />{match.stadium}{match.city ? `, ${match.city}` : ""}</span>}
      </div>

      {(hasFinalScore || pred || !canPredict) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-border pt-3 sm:justify-between">
          <span className="text-xs text-muted-foreground font-body">
            {pred ? `Tu predicción: ${pred.predicted_home_score} - ${pred.predicted_away_score}` : "Sin predicción registrada"}
          </span>
          {hasFinalScore ? <PointsBadge pred={pred} /> : pred ? <Badge variant="outline" className="text-[10px]">Guardada</Badge> : null}
        </div>
      )}
    </motion.div>
  );
};

export default PredictionsTab;
