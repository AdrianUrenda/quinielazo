/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, CalendarClock, Filter, Lock, MapPin, Radio, RefreshCw, Save, ShieldQuestion, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  cancelledStatuses,
  finalStatuses,
  formatMexicoDateTime,
  formatMexicoTime,
  getStatusBadge,
  liveStatuses,
} from "@/lib/matchCalendar";

interface Props {
  userId: string;
}

const demoRoundFilters = [
  { value: "all", label: "Todos" },
  { value: "reclassification", label: "Reclasificación" },
  { value: "quarterfinal", label: "Cuartos" },
  { value: "semifinal", label: "Semis" },
  { value: "final", label: "Final" },
];

const roundMeta: Record<string, { stage: string; label: string; order: number }> = {
  reclassification: { stage: "reclassification", label: "Reclasificación", order: 0 },
  quarterfinal: { stage: "quarterfinal", label: "Cuartos de Final", order: 1 },
  semifinal: { stage: "semifinal", label: "Semifinales", order: 2 },
  final: { stage: "final", label: "Final", order: 3 },
};

const normalizeText = (value?: string | null) => (value || "").toLowerCase();

const getDemoStage = (match: any) => {
  const value = normalizeText(match.round_label);
  if (value.includes("reclas") || value.includes("relegation round")) return "reclassification";
  if (value.includes("quarter") || value.includes("cuarto")) return "quarterfinal";
  if (value.includes("semi")) return "semifinal";
  if (value.includes("final")) return "final";
  return "all";
};

const getDemoStageLabel = (match: any) => {
  const stage = getDemoStage(match);
  return roundMeta[stage]?.label || match.round_label || "Liguilla";
};

const isTeamDefined = (name?: string | null) => {
  const normalized = (name ?? "").trim().toLowerCase();
  return !!normalized && !["tbd", "por definir", "to be defined", "undefined", "null"].includes(normalized);
};

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo && isTeamDefined(name) ? (
    <img src={logo} alt={`Escudo de ${name}`} className="h-5 w-5 rounded-full object-contain" loading="lazy" />
  ) : (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ShieldQuestion className="h-3 w-3" />
    </span>
  );

const PointsBadge = ({ pred }: { pred?: any }) => {
  if (!pred) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Sin predicción</Badge>;
  if (pred.points_awarded === 3) return <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">¡Exacto! +3 pts</Badge>;
  if (pred.points_awarded === 1) return <Badge className="border-secondary/20 bg-secondary/10 text-[10px] text-secondary-foreground">Resultado +1 pt</Badge>;
  if (pred.points_awarded === 0) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">0 pts</Badge>;
  return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Pendiente</Badge>;
};

const DemoPredictionsTab = ({ userId }: Props) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});
  const [stageFilter, setStageFilter] = useState("all");

  const { data: matches, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["demo-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_matches")
        .select("*")
        .order("round_order", { ascending: true, nullsFirst: false })
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: predictions } = useQuery({
    queryKey: ["demo-predictions", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("demo_predictions").select("*").eq("user_id", userId);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { data: isDemoAdmin } = useQuery({
    queryKey: ["demo-admin-role", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("current_user_is_admin" as any);
      if (error) return false;
      return Boolean(data);
    },
  });

  const predictionMap = useMemo(() => new Map(predictions?.map((p) => [p.demo_match_id, p])), [predictions]);

  const syncLiguilla = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("demo-sync", { body: { action: "sync-liguilla" } });
      if (error) throw error;
      return data as { fixturesSynced: number; predictionsScored: number; updatedAt: string; season: string };
    },
    onSuccess: (data) => {
      toast.success(`Calendario actualizado: ${data.fixturesSynced} partidos · Temporada ${data.season}`);
      queryClient.invalidateQueries({ queryKey: ["demo-matches"] });
      queryClient.invalidateQueries({ queryKey: ["demo-predictions", userId] });
      queryClient.invalidateQueries({ queryKey: ["demo-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["demo-member-predictions"] });
    },
    onError: () => toast.error("No pudimos actualizar la Liguilla. Intenta de nuevo."),
  });

  const savePrediction = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: string; home: number; away: number }) => {
      const existing = predictionMap.get(matchId) as any;
      if (existing) {
        const { error } = await supabase
          .from("demo_predictions")
          .update({ predicted_home_score: home, predicted_away_score: away, submitted_at: new Date().toISOString() })
          .eq("id", existing.id);
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
    onError: (err: Error) => toast.error(err.message),
  });

  const liguillaMatches = useMemo(
    () => (matches || []).filter((match) => match.round_label || (match.jornada ?? 0) >= 900),
    [matches],
  );

  const filtered = useMemo(
    () => liguillaMatches.filter((match) => stageFilter === "all" || getDemoStage(match) === stageFilter),
    [liguillaMatches, stageFilter],
  );

  const groupedRounds = useMemo(() => {
    return filtered.reduce((acc: Record<string, any[]>, match) => {
      const key = getDemoStage(match);
      const label = getDemoStageLabel(match);
      if (!acc[key]) acc[key] = [];
      acc[key].push({ ...match, _roundLabel: label });
      return acc;
    }, {});
  }, [filtered]);

  const roundKeys = Object.keys(groupedRounds).sort((a, b) => (roundMeta[a]?.order ?? 9) - (roundMeta[b]?.order ?? 9));

  const lastUpdated = useMemo(() => {
    const latest = liguillaMatches.map((match) => match.last_synced_at).filter(Boolean).sort().at(-1);
    return latest ? formatMexicoTime(latest) : null;
  }, [liguillaMatches]);

  const canPredict = (match: any) =>
    match.status === "upcoming" &&
    new Date(match.kickoff_utc).getTime() > Date.now() &&
    isTeamDefined(match.home_team) &&
    isTeamDefined(match.away_team);

  const handleSaveAll = async () => {
    const toSave = liguillaMatches.filter((match) => {
      if (!canPredict(match)) return false;
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
      } catch {
        // Error already toasted
      }
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

  if (isLoading) return <CalendarSkeleton />;

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-card">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="font-display text-2xl tracking-wide text-foreground">NO SE PUDO CARGAR EL DEMO</h2>
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
            <p className="font-display text-lg tracking-wider text-foreground">LIGUILLA LIGA MX</p>
            <p className="text-xs text-muted-foreground font-body">
              {lastUpdated ? `Última actualización: ${lastUpdated} CDMX` : "Actualiza para sincronizar API-Football"}
            </p>
          </div>
          {isDemoAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => syncLiguilla.mutate()} disabled={syncLiguilla.isPending || isFetching}>
              <RefreshCw className={`h-4 w-4 ${syncLiguilla.isPending ? "animate-spin" : ""}`} />
              Actualizar resultados
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {demoRoundFilters.map((filter) => (
          <Button key={filter.value} variant={stageFilter === filter.value ? "default" : "outline"} size="sm" onClick={() => setStageFilter(filter.value)} className="text-xs">
            {filter.label}
          </Button>
        ))}
      </div>

      {syncLiguilla.isPending && <Skeleton className="h-24 rounded-xl" />}

      {!roundKeys.length ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          {stageFilter === "all" ? <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" /> : <Filter className="mx-auto h-8 w-8 text-muted-foreground" />}
          <p className="mt-3 font-display text-xl tracking-wider text-foreground">SIN PARTIDOS</p>
          <p className="mt-1 text-sm text-muted-foreground font-body">No se encontraron partidos con estos filtros.</p>
        </div>
      ) : (
        roundKeys.map((roundKey) => {
          const roundMatches = groupedRounds[roundKey];
          const legGroups = roundMatches.reduce((acc: Record<string, any[]>, match: any) => {
            const key = match.leg_label || "Partidos";
            if (!acc[key]) acc[key] = [];
            acc[key].push(match);
            return acc;
          }, {});
          const legKeys = Object.keys(legGroups).sort((a, b) => (a === "Ida" ? -1 : b === "Ida" ? 1 : a.localeCompare(b)));

          return (
            <section key={roundKey} className="space-y-3">
              <div className="sticky top-20 z-10 border-b border-border bg-background/95 py-3 backdrop-blur-sm">
                <h3 className="text-sm font-display tracking-wider text-primary uppercase">{roundMeta[roundKey]?.label || roundMatches[0]?._roundLabel}</h3>
              </div>
              {legKeys.map((legKey) => (
                <div key={legKey} className="space-y-3">
                  {legKey !== "Partidos" && <p className="text-xs font-display tracking-wider text-muted-foreground">{legKey.toUpperCase()}</p>}
                  {legGroups[legKey].map((match: any, index: number) => (
                    <DemoPredictionMatchCard
                      key={match.id}
                      match={match}
                      index={index}
                      pred={predictionMap.get(match.id)}
                      canPredict={canPredict(match)}
                      getScore={getScore}
                      setScore={setScore}
                    />
                  ))}
                </div>
              ))}
            </section>
          );
        })
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

const DemoPredictionMatchCard = ({ match, index, pred, canPredict, getScore, setScore }: any) => {
  const statusDetail = match.status_detail || (match.status === "finished" ? "FT" : "NS");
  const badge = getStatusBadge(match.status, statusDetail);
  const homeName = isTeamDefined(match.home_team) ? match.home_team : "Por definir";
  const awayName = isTeamDefined(match.away_team) ? match.away_team : "Por definir";
  const hasFinalScore = (match.status === "finished" || finalStatuses.has(statusDetail)) && match.home_score !== null && match.away_score !== null;
  const isLive = match.status === "live" || liveStatuses.has(statusDetail);
  const isCancelled = cancelledStatuses.has(statusDetail);
  const lockedLabel = !isTeamDefined(match.home_team) || !isTeamDefined(match.away_team) ? "Por definir" : "Cerrada";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="card-elevated rounded-xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Trophy className="h-3 w-3 shrink-0 text-gold" />
          <span className="truncate text-xs font-display tracking-wider text-primary">
            {getDemoStageLabel(match)}{match.leg_label ? ` · ${match.leg_label}` : ""}
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
          <div className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /><span className="text-xs font-body">{lockedLabel}</span></div>
        )}

        <span className="flex min-w-0 items-center justify-start gap-2 text-left font-body font-semibold text-foreground text-sm sm:text-base">
          <TeamLogo logo={match.away_team_logo} name={awayName} />
          <span className="truncate">{awayName}</span>
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-body sm:flex-row">
        {!hasFinalScore && !isLive && !isCancelled && <span>{formatMexicoDateTime(match.kickoff_utc)}</span>}
        {(match.stadium || match.city) && <span className="flex items-center gap-1 text-center"><MapPin className="h-3 w-3 shrink-0" />{match.stadium || "Sede por confirmar"}{match.city ? `, ${match.city}` : ""}</span>}
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

export default DemoPredictionsTab;
