import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Calendar, Filter, MapPin, RefreshCw, Trophy } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string | null; city?: string | null } | null;
    status: { short: string; long?: string | null };
  };
  league: { round?: string | null };
  teams: {
    home: { name?: string | null; logo?: string | null } | null;
    away: { name?: string | null; logo?: string | null } | null;
  };
  goals: { home: number | null; away: number | null };
};

type FixturesPayload = {
  fixtures?: { response?: ApiFootballFixture[] };
  teamGroupMap?: Record<string, string>;
  updatedAt: string;
};

const finalStatuses = new Set(["FT", "AET", "PEN"]);
const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P"]);
const notStartedStatuses = new Set(["NS", "TBD"]);
const cancelledStatuses = new Set(["PST", "CANC"]);

const stageFilters = [
  { value: "all", label: "Todos" },
  { value: "group", label: "Grupos" },
  { value: "round_of_32", label: "32avos" },
  { value: "round_of_16", label: "8vos" },
  { value: "quarterfinal", label: "4tos" },
  { value: "semifinal", label: "Semis" },
  { value: "third_place", label: "3er Lugar" },
  { value: "final", label: "Final" },
];

const groupFilters = ["all", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const mexicoDateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const mexicoTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const mexicoDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatMexicoDateTime = (iso: string) => `${mexicoDateTimeFormatter.format(new Date(iso))} CDMX`;
const formatMexicoTime = (iso: string) => mexicoTimeFormatter.format(new Date(iso));
const formatMexicoDateKey = (iso: string) => mexicoDateKeyFormatter.format(new Date(iso));

const normalizeRound = (round?: string | null) => (round || "").toLowerCase();

const getStage = (round?: string | null) => {
  const value = normalizeRound(round);
  if (value.includes("group")) return "group";
  if (value.includes("round of 32")) return "round_of_32";
  if (value.includes("round of 16") || value.includes("8th finals")) return "round_of_16";
  if (value.includes("quarter")) return "quarterfinal";
  if (value.includes("semi")) return "semifinal";
  if (value.includes("3rd") || value.includes("third")) return "third_place";
  if (value.includes("final")) return "final";
  return "all";
};

const getGroup = (round?: string | null) => round?.match(/group\s+([A-L])/i)?.[1]?.toUpperCase() || null;

const getStageLabel = (round?: string | null) => {
  const stage = getStage(round);
  const labels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "Treintaidosavos",
    round_of_16: "Octavos de Final",
    quarterfinal: "Cuartos de Final",
    semifinal: "Semifinal",
    third_place: "Tercer Lugar",
    final: "Final",
    all: round || "Fase por definir",
  };
  return labels[stage];
};

const getStatusBadge = (status: string) => {
  if (finalStatuses.has(status)) return { text: "Finalizado", className: "bg-muted text-muted-foreground border-border" };
  if (liveStatuses.has(status)) return { text: "En curso", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (status === "PST") return { text: "Pospuesto", className: "bg-secondary/15 text-secondary-foreground border-secondary/30" };
  if (status === "CANC") return { text: "Cancelado", className: "bg-destructive/10 text-destructive border-destructive/20" };
  return { text: "Próximo", className: "bg-primary/10 text-primary border-primary/20" };
};

const TeamLogo = ({ logo, name }: { logo?: string | null; name: string }) =>
  logo ? <img src={logo} alt={`Bandera de ${name}`} className="h-5 w-5 rounded-full object-contain" loading="lazy" /> : null;

const MatchCalendar = () => {
  const [stageFilter, setStageFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["api-football-world-cup-2026-fixtures"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<FixturesPayload>("api-football-fixtures");
      if (error) throw error;
      return data;
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const fixtures = useMemo(
    () => [...(data?.fixtures?.response || [])].sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()),
    [data]
  );

  const filtered = useMemo(() => {
    return fixtures.filter((fixture) => {
      if (stageFilter !== "all" && getStage(fixture.league.round) !== stageFilter) return false;
      if (groupFilter !== "all" && getGroup(fixture.league.round) !== groupFilter) return false;
      return true;
    });
  }, [fixtures, stageFilter, groupFilter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ApiFootballFixture[]> = {};
    filtered.forEach((fixture) => {
      const dateKey = formatMexicoDateKey(fixture.fixture.date);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(fixture);
    });
    return groups;
  }, [filtered]);

  const lastUpdated = data?.updatedAt ? formatMexicoTime(data.updatedAt) : null;

  return (
    <>
      <Helmet>
        <title>Calendario Mundial 2026 — Quinielazo 2026</title>
        <meta name="description" content="Consulta el calendario completo del Mundial FIFA 2026: partidos, horarios, resultados y estadísticas oficiales." />
        <link rel="canonical" href="https://quinielazo.link/calendar" />
        <meta property="og:title" content="Calendario Mundial 2026 — Quinielazo 2026" />
        <meta property="og:description" content="Todos los partidos, horarios y resultados del Mundial FIFA 2026." />
        <meta property="og:url" content="https://quinielazo.link/calendar" />
        <meta property="og:image" content="https://quinielazo.link/og-image.jpg" />
      </Helmet>
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="text-center lg:text-left">
              <div className="mb-2 flex items-center justify-center gap-2 text-primary lg:justify-start">
                <Calendar className="h-5 w-5" />
                <span className="font-display text-sm tracking-wider">FIFA WORLD CUP 2026™</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display text-foreground tracking-wide mb-2">CALENDARIO</h1>
              <p className="text-lg text-muted-foreground font-body">Marcadores finales oficiales y horarios en CDMX</p>
              {fixtures.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground font-body">{filtered.length} de {fixtures.length} partidos</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 lg:items-end">
              {lastUpdated && <p className="text-xs font-body text-muted-foreground">Última actualización: {lastUpdated} CDMX</p>}
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Actualizar resultados
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-4">
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
            <div className="flex flex-wrap justify-center gap-1.5 mb-8">
              {groupFilters.map((group) => (
                <Button
                  key={group}
                  variant={groupFilter === group ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setGroupFilter(group)}
                  className="text-xs h-7 px-2.5"
                >
                  {group === "all" ? "Todos" : `Grupo ${group}`}
                </Button>
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <CalendarSkeleton />
            ) : isError ? (
              <Card className="border-destructive/30 bg-card">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <h2 className="font-display text-2xl tracking-wide text-foreground">NO SE PUDO CARGAR EL CALENDARIO</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Intenta nuevamente en unos segundos. {error instanceof Error ? error.message : ""}
                    </p>
                  </div>
                  <Button onClick={() => refetch()} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-body">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No se encontraron partidos con estos filtros.</p>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([dateKey, dayFixtures]) => (
                <section key={dateKey} className="mb-8">
                  <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm py-3 mb-3 border-b border-border">
                    <h3 className="text-sm font-display tracking-wider text-primary uppercase">
                      {mexicoDateTimeFormatter.format(new Date(`${dateKey}T12:00:00-06:00`)).replace(/, \d{2}:\d{2}/, "")}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {dayFixtures.map((fixture, index) => <MatchCard key={fixture.fixture.id} fixture={fixture} index={index} />)}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
};

const CalendarSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div key={index} className="card-elevated rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="mx-auto mb-3 h-7 w-4/5" />
        <Skeleton className="mx-auto h-4 w-56" />
      </div>
    ))}
  </div>
);

const MatchCard = ({ fixture, index }: { fixture: ApiFootballFixture; index: number }) => {
  const status = fixture.fixture.status.short;
  const badge = getStatusBadge(status);
  const group = getGroup(fixture.league.round);
  const homeName = fixture.teams.home?.name || "TBD";
  const awayName = fixture.teams.away?.name || "TBD";
  const hasFinalScore = finalStatuses.has(status) && fixture.goals.home !== null && fixture.goals.away !== null;
  const isLive = liveStatuses.has(status);
  const isCancelled = cancelledStatuses.has(status);
  const isNotStarted = notStartedStatuses.has(status) || (!hasFinalScore && !isLive && !isCancelled);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="card-elevated rounded-xl p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {getStage(fixture.league.round) !== "group" && <Trophy className="h-3 w-3 shrink-0 text-gold" />}
          <span className="truncate text-xs font-display tracking-wider text-primary">
            {group ? `Grupo ${group}` : getStageLabel(fixture.league.round)}
          </span>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${badge.className}`}>{badge.text}</Badge>
      </div>

      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right font-body font-semibold text-foreground text-sm sm:text-base">
          <span className="truncate">{homeName}</span>
          <TeamLogo logo={fixture.teams.home?.logo} name={homeName} />
        </span>

        {hasFinalScore ? (
          <span className="shrink-0 font-display text-2xl sm:text-3xl px-2 text-foreground">
            {fixture.goals.home} – {fixture.goals.away}
          </span>
        ) : isLive ? (
          <span className="shrink-0 rounded-full bg-destructive/10 px-3 py-1 text-xs font-display text-destructive">En curso</span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-display text-muted-foreground">{formatMexicoTime(fixture.fixture.date)}</span>
        )}

        <span className="flex min-w-0 flex-1 items-center justify-start gap-2 text-left font-body font-semibold text-foreground text-sm sm:text-base">
          <TeamLogo logo={fixture.teams.away?.logo} name={awayName} />
          <span className="truncate">{awayName}</span>
        </span>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-body sm:flex-row">
        {hasFinalScore && status === "PEN" && <Badge variant="secondary" className="text-[10px]">Penales</Badge>}
        {hasFinalScore && status === "AET" && <Badge variant="secondary" className="text-[10px]">T. Extra</Badge>}
        {isNotStarted && <span>{formatMexicoDateTime(fixture.fixture.date)}</span>}
        {isCancelled && <span>{fixture.fixture.status.long || badge.text}</span>}
        {(fixture.fixture.venue?.name || fixture.fixture.venue?.city) && (
          <span className="flex items-center gap-1 text-center">
            <MapPin className="h-3 w-3 shrink-0" />
            {fixture.fixture.venue?.name}{fixture.fixture.venue?.city ? `, ${fixture.fixture.venue.city}` : ""}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default MatchCalendar;
