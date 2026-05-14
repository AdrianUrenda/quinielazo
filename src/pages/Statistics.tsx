import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, RefreshCw, Shield, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type StandingTeam = {
  rank: number;
  team: { id: number; name: string; logo?: string };
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  goalsDiff: number;
  points: number;
  group?: string;
};

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round?: string };
  teams: {
    home: { name?: string; logo?: string; winner?: boolean | null } | null;
    away: { name?: string; logo?: string; winner?: boolean | null } | null;
  };
  goals: { home: number | null; away: number | null };
};

type StatsPayload = {
  standings?: { response?: Array<{ league?: { standings?: StandingTeam[][] } }> };
  fixtures?: { response?: ApiFixture[] };
  updatedAt: string;
};

const groupLetters = "ABCDEFGHIJKL".split("");

const knockoutRounds = [
  { title: "Ronda de 32", matchCount: 16, aliases: ["round of 32"] },
  { title: "Ronda de 16", matchCount: 8, aliases: ["round of 16", "8th finals"] },
  { title: "Cuartos de Final", matchCount: 4, aliases: ["quarter-finals", "quarterfinals"] },
  { title: "Semifinales", matchCount: 2, aliases: ["semi-finals", "semifinals"] },
  { title: "Final y Tercer Lugar", matchCount: 2, aliases: ["final", "3rd place final", "third place"] },
];

const normalize = (value?: string) => (value || "").toLowerCase();

const getRoundFixtures = (fixtures: ApiFixture[] | undefined, aliases: string[]) =>
  (fixtures || [])
    .filter((fixture) => aliases.some((alias) => normalize(fixture.league.round).includes(alias)))
    .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());

const getTeamLogo = (team?: { name?: string; logo?: string } | null) =>
  team?.logo ? <img src={team.logo} alt="" className="h-4 w-4 rounded-full object-contain" loading="lazy" /> : null;

const Statistics = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["api-football-world-cup-2026"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<StatsPayload>("api-football-stats");
      if (error) throw error;
      return data;
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const standingsByGroup = useMemo(() => {
    const groups = new Map<string, StandingTeam[]>();
    const rawGroups = data?.standings?.response?.[0]?.league?.standings || [];

    rawGroups.forEach((teams) => {
      const groupName = teams[0]?.group || "";
      const letter = groupName.match(/[A-L]$/)?.[0] || groupName.replace(/.*Group\s+/i, "");
      if (letter) groups.set(letter, teams);
    });

    return groups;
  }, [data]);

  const hasKnockoutData = useMemo(
    () => knockoutRounds.some((round) => getRoundFixtures(data?.fixtures?.response, round.aliases).length > 0),
    [data]
  );

  const lastUpdated = data?.updatedAt
    ? format(new Date(data.updatedAt), "d MMM yyyy, HH:mm", { locale: es })
    : null;

  return (
    <>
      <Helmet>
        <title>Estadísticas Mundial 2026 — Quinielazo 2026</title>
        <meta name="description" content="Standings de grupos y bracket de la fase eliminatoria del Mundial FIFA 2026. Datos actualizados en vivo." />
        <link rel="canonical" href="https://quinielazo.link/statistics" />
        <meta property="og:title" content="Estadísticas Mundial 2026 — Quinielazo 2026" />
        <meta property="og:description" content="Tablas de posiciones y bracket del Mundial FIFA 2026." />
        <meta property="og:url" content="https://quinielazo.link/statistics" />
      </Helmet>
      <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-16">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              <span className="font-display text-sm tracking-wider">FIFA WORLD CUP 2026™</span>
            </div>
            <h1 className="text-5xl font-display tracking-wide text-foreground md:text-7xl">ESTADÍSTICAS</h1>
            <p className="font-body text-sm text-muted-foreground md:text-base">
              Standings oficiales y bracket actualizados al cargar la página.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            {lastUpdated && <p className="text-xs font-body text-muted-foreground">Última actualización: {lastUpdated}</p>}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Reintentar
            </Button>
          </div>
        </div>

        {isError ? (
          <Card className="mx-auto max-w-2xl border-destructive/30 bg-card">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <h2 className="font-display text-2xl tracking-wide text-foreground">NO SE PUDIERON CARGAR LAS ESTADÍSTICAS</h2>
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
        ) : (
          <Tabs defaultValue="groups" className="w-full">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-2 md:w-[420px]">
              <TabsTrigger value="groups">Fase de Grupos</TabsTrigger>
              <TabsTrigger value="knockout">Fase Eliminatoria</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="mt-0">
              {isLoading ? <GroupsSkeleton /> : <GroupsView standingsByGroup={standingsByGroup} />}
            </TabsContent>

            <TabsContent value="knockout" className="mt-0">
              {isLoading ? (
                <BracketSkeleton />
              ) : (
                <BracketView fixtures={data?.fixtures?.response || []} hasKnockoutData={hasKnockoutData} />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
    </>
  );
};

const GroupsSkeleton = () => (
  <div className="grid gap-5 lg:grid-cols-2">
    {Array.from({ length: 6 }).map((_, index) => (
      <Card key={index}>
        <CardHeader className="pb-3"><Skeleton className="h-6 w-28" /></CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((__, row) => <Skeleton key={row} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    ))}
  </div>
);

const GroupsView = ({ standingsByGroup }: { standingsByGroup: Map<string, StandingTeam[]> }) => (
  <div className="grid gap-5 lg:grid-cols-2">
    {groupLetters.map((letter) => {
      const teams = standingsByGroup.get(letter) || [];
      return (
        <Card key={letter} className="overflow-hidden">
          <CardHeader className="border-b bg-muted/40 py-4">
            <CardTitle className="text-2xl tracking-wide">Grupo {letter}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-3">Pos</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-center">PJ</TableHead>
                  <TableHead className="text-center">G</TableHead>
                  <TableHead className="text-center">E</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GC</TableHead>
                  <TableHead className="text-center">DG</TableHead>
                  <TableHead className="text-center font-bold text-foreground">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">Sin datos oficiales aún.</TableCell></TableRow>
                ) : teams.map((team) => (
                  <TableRow key={team.team.id} className="relative hover:bg-muted/40">
                    <TableCell className="px-3 font-semibold">
                      {team.rank <= 2 && <span className="absolute left-0 top-0 h-full w-1 bg-primary" />}
                      {team.rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-32 items-center gap-2 font-semibold text-foreground">
                        {getTeamLogo(team.team)}
                        <span className="truncate">{team.team.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{team.all.played}</TableCell>
                    <TableCell className="text-center">{team.all.win}</TableCell>
                    <TableCell className="text-center">{team.all.draw}</TableCell>
                    <TableCell className="text-center">{team.all.lose}</TableCell>
                    <TableCell className="text-center">{team.all.goals.for}</TableCell>
                    <TableCell className="text-center">{team.all.goals.against}</TableCell>
                    <TableCell className="text-center">{team.goalsDiff}</TableCell>
                    <TableCell className="text-center font-bold text-foreground">{team.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    })}
  </div>
);

const BracketSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {knockoutRounds.map((round) => (
      <div key={round.title} className="min-w-64 space-y-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: Math.min(round.matchCount, 5) }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
      </div>
    ))}
  </div>
);

const BracketView = ({ fixtures, hasKnockoutData }: { fixtures: ApiFixture[]; hasKnockoutData: boolean }) => (
  <div>
    {!hasKnockoutData && (
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        <Shield className="h-4 w-4 shrink-0" />
        El bracket se actualizará conforme avance el torneo.
      </div>
    )}
    <div className="flex gap-4 overflow-x-auto pb-4">
      {knockoutRounds.map((round) => {
        const roundFixtures = getRoundFixtures(fixtures, round.aliases);
        const matches = Array.from({ length: Math.max(round.matchCount, roundFixtures.length) }, (_, index) => roundFixtures[index]);

        return (
          <section key={round.title} className="min-w-64 flex-1">
            <h2 className="sticky left-0 mb-3 font-display text-2xl tracking-wide text-primary">{round.title}</h2>
            <div className="space-y-3">
              {matches.map((fixture, index) => <BracketMatch key={fixture?.fixture.id || `${round.title}-${index}`} fixture={fixture} />)}
            </div>
          </section>
        );
      })}
    </div>
  </div>
);

const BracketMatch = ({ fixture }: { fixture?: ApiFixture }) => {
  const isPlayed = fixture?.goals.home !== null && fixture?.goals.away !== null;
  const teams = [fixture?.teams.home, fixture?.teams.away];
  const goals = [fixture?.goals.home, fixture?.goals.away];

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      {teams.map((team, index) => {
        const isWinner = Boolean(team?.winner);
        return (
          <div key={index} className={`flex items-center justify-between gap-2 rounded-md px-2 py-2 ${isWinner ? "bg-primary/10 text-primary" : "text-foreground"}`}>
            <div className="flex min-w-0 items-center gap-2">
              {getTeamLogo(team)}
              <span className={`truncate text-sm ${isWinner ? "font-bold" : "font-medium"}`}>{team?.name || "TBD"}</span>
            </div>
            <span className="font-display text-lg tabular-nums">{isPlayed ? goals[index] : "—"}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Statistics;