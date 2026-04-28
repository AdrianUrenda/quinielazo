/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CalendarClock, Lock, MapPin, Radio, RefreshCw, Save, ShieldQuestion } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  userId: string;
}

const MX_TIME_ZONE = "America/Mexico_City";
const FINISH_DETAILS: Record<string, string> = { AET: "T. Extra", PEN: "Penales" };

const formatMxDateTime = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-MX", {
    timeZone: MX_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(new Date(value));

const isTeamDefined = (name?: string | null) => {
  const normalized = (name ?? "").trim().toLowerCase();
  return !!normalized && normalized !== "tbd" && normalized !== "por definir";
};

const TeamBadge = ({ name, logo, align = "left" }: { name: string; logo?: string | null; align?: "left" | "right" }) => {
  const defined = isTeamDefined(name);
  const mark = defined && logo ? (
    <img src={logo} alt={`Escudo de ${name}`} className="h-6 w-6 shrink-0 object-contain" />
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <ShieldQuestion className="h-3.5 w-3.5" />
    </span>
  );

  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${align === "right" ? "justify-end text-right" : "justify-start text-left"}`}>
      {align === "right" && mark}
      <span className={`truncate text-sm font-body font-semibold ${defined ? "text-foreground" : "text-muted-foreground"}`}>
        {defined ? name : "Por definir"}
      </span>
      {align === "left" && mark}
    </div>
  );
};

const DemoPredictionsTab = ({ userId }: Props) => {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  const { data: matches, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["demo-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_matches")
        .select("*")
        .order("jornada", { ascending: true })
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return data || [];
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
      return data || [];
    },
  });

  const predictionMap = useMemo(() => new Map(predictions?.map((p: any) => [p.demo_match_id, p])), [predictions]);

  const syncLiguilla = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("demo-sync", {
        body: { action: "sync-liguilla" },
      });
      if (error) throw error;
      return data as { fixturesSynced: number; predictionsScored: number; updatedAt: string; season: string };
    },
    onSuccess: (data) => {
      toast.success(`Calendario actualizado: ${data.fixturesSynced} partidos · Temporada ${data.season}`);
      queryClient.invalidateQueries({ queryKey: ["demo-matches"] });
      queryClient.invalidateQueries({ queryKey: ["demo-predictions", userId] });
      queryClient.invalidateQueries({ queryKey: ["demo-leaderboard"] });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["demo-predictions", userId] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const isPredictable = (match: any) =>
    match.status === "upcoming" &&
    new Date(match.kickoff_utc) > new Date() &&
    isTeamDefined(match.home_team) &&
    isTeamDefined(match.away_team);

  const handleSaveAll = async () => {
    const toSave = (matches || []).filter((match: any) => {
      if (!isPredictable(match)) return false;
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
    if (saved > 0) toast.success(`${saved} predicción(es) guardada(s)`);
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

  const getPointsBadge = (pred: any) => {
    if (!pred) return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Sin predicción</Badge>;
    if (pred.points_awarded === null || pred.points_awarded === undefined) return null;
    if (pred.points_awarded === 3) return <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">¡Exacto! +3 pts</Badge>;
    if (pred.points_awarded === 1) return <Badge className="border-secondary/20 bg-secondary/10 text-[10px] text-secondary-foreground">Resultado +1 pt</Badge>;
    return <Badge variant="outline" className="bg-muted/50 text-[10px] text-muted-foreground">Sin puntos</Badge>;
  };

  const lastUpdated = useMemo(() => {
    const latest = (matches || [])
      .map((match: any) => match.last_synced_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    return latest ? formatMxDateTime(latest, { hour: "2-digit", minute: "2-digit", day: undefined, month: undefined }) : null;
  }, [matches]);

  const groupedRounds = useMemo(() => {
    const liguilla = (matches || [])
      .filter((match: any) => (match.round_label || match.jornada >= 900))
      .sort((a: any, b: any) => (a.round_order ?? 9) - (b.round_order ?? 9) || new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

    return liguilla.reduce((acc: Record<string, any[]>, match: any) => {
      const key = match.round_label || "Liguilla";
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});
  }, [matches]);

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="font-display text-xl text-foreground">NO PUDIMOS CARGAR EL CALENDARIO</p>
        <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Intenta nuevamente."}</p>
        <Button className="mt-4 gap-2" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      </div>
    );
  }

  const roundNames = Object.keys(groupedRounds);

  return (
    <div className="space-y-6">
      <div className="card-elevated rounded-2xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg tracking-wider text-foreground">LIGUILLA CLAUSURA</p>
            <p className="text-xs text-muted-foreground font-body">
              {lastUpdated ? `Última actualización: ${lastUpdated}` : "Actualiza para cargar los fixtures oficiales"}
            </p>
          </div>
          <Button className="gap-2" onClick={() => syncLiguilla.mutate()} disabled={syncLiguilla.isPending}>
            <RefreshCw className={`h-4 w-4 ${syncLiguilla.isPending ? "animate-spin" : ""}`} />
            Actualizar resultados
          </Button>
        </div>
        {syncLiguilla.isError && (
          <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            No se pudo consultar API-Football. Revisa la conexión e intenta de nuevo.
          </div>
        )}
      </div>

      {syncLiguilla.isPending && <Skeleton className="h-24 rounded-xl" />}

      {!roundNames.length ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-display text-xl tracking-wider text-foreground">SIN PARTIDOS DE LIGUILLA</p>
          <p className="mt-1 text-sm text-muted-foreground font-body">Presiona “Actualizar resultados” para sincronizar el calendario desde API-Football.</p>
        </div>
      ) : (
        roundNames.map((roundName) => (
          <section key={roundName} className="space-y-3">
            <h3 className="font-display text-lg tracking-wider text-foreground">{roundName.toUpperCase()}</h3>
            {groupedRounds[roundName].map((match: any, i: number) => {
              const pred = predictionMap.get(match.id) as any;
              const lockedBecauseTbd = !isTeamDefined(match.home_team) || !isTeamDefined(match.away_team);
              const lockedBecauseTime = new Date(match.kickoff_utc) <= new Date();
              const canPredict = isPredictable(match);
              const statusDetail = match.status_detail || "NS";

              return (
                <motion.div key={match.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card-elevated rounded-xl p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-display tracking-wider">
                      {match.leg_label ? `${roundName} - ${match.leg_label}` : roundName}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-body">{formatMxDateTime(match.kickoff_utc)}</span>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
                    <TeamBadge name={match.home_team} logo={match.home_team_logo} align="right" />

                    {match.status === "finished" ? (
                      <div className="text-center">
                        <span className="font-display text-2xl text-foreground">{match.home_score} - {match.away_score}</span>
                        {FINISH_DETAILS[statusDetail] && <p className="text-[10px] text-muted-foreground font-body">{FINISH_DETAILS[statusDetail]}</p>}
                      </div>
                    ) : match.status === "live" ? (
                      <Badge className="border-destructive/20 bg-destructive/10 text-destructive">
                        <Radio className="mr-1 h-3 w-3 animate-pulse" /> En curso
                      </Badge>
                    ) : canPredict ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <Input className="h-9 w-12 p-0 text-center font-display text-lg" value={getScore(match.id, "home")} onChange={(e) => setScore(match.id, "home", e.target.value)} placeholder="-" />
                        <span className="font-display text-muted-foreground">:</span>
                        <Input className="h-9 w-12 p-0 text-center font-display text-lg" value={getScore(match.id, "away")} onChange={(e) => setScore(match.id, "away", e.target.value)} placeholder="-" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-xs font-body">{lockedBecauseTbd ? "Por definir" : lockedBecauseTime ? "Cerrada" : "Pendiente"}</span>
                      </div>
                    )}

                    <TeamBadge name={match.away_team} logo={match.away_team_logo} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground font-body">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{match.stadium || "Sede por confirmar"}{match.city ? `, ${match.city}` : ""}</span>
                    </div>
                    {match.status === "finished" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body">
                          {pred ? `Tu predicción: ${pred.predicted_home_score} - ${pred.predicted_away_score}` : "Sin predicción"}
                        </span>
                        {getPointsBadge(pred)}
                      </div>
                    ) : pred ? (
                      <span className="text-xs text-muted-foreground font-body">Guardada: {pred.predicted_home_score} - {pred.predicted_away_score}</span>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </section>
        ))
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

export default DemoPredictionsTab;
