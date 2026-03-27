import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, Trash2, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

const DemoAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedJornada, setExpandedJornada] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  const { data: members } = useQuery({
    queryKey: ["demo-admin-members"],
    queryFn: async () => {
      const { data: dmembers } = await supabase.from("demo_group_members").select("user_id, joined_at");
      if (!dmembers?.length) return [];
      const userIds = dmembers.map((m: any) => m.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", userIds);
      return dmembers.map((m: any) => {
        const profile = (profiles || []).find((p: any) => p.id === m.user_id);
        return { ...m, displayName: profile?.display_name || "—", email: profile?.email || "" };
      });
    },
    enabled: !!user,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["demo-admin-matches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("demo_matches")
        .select("*")
        .order("jornada", { ascending: true })
        .order("kickoff_utc", { ascending: true });
      return data || [];
    },
  });

  const invokeSync = async (action: string, body?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    const resp = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/demo-sync?action=${action}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Error");
    return result;
  };

  const updateScore = useMutation({
    mutationFn: (params: { matchId: string; homeScore: number; awayScore: number }) =>
      invokeSync("update-score", params),
    onSuccess: (data) => {
      toast.success(`Marcador registrado. ${data.predictionsScored} predicciones puntuadas.`);
      queryClient.invalidateQueries({ queryKey: ["demo-admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["demo-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["demo-leaderboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetDemo = useMutation({
    mutationFn: () => invokeSync("reset"),
    onSuccess: () => {
      toast.success("Demo reseteado completamente");
      queryClient.invalidateQueries({ queryKey: ["demo-admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["demo-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["demo-leaderboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmitScore = (matchId: string) => {
    const s = scores[matchId];
    if (!s || s.home === "" || s.away === "") {
      toast.error("Ingresa ambos marcadores");
      return;
    }
    updateScore.mutate({
      matchId,
      homeScore: parseInt(s.home),
      awayScore: parseInt(s.away),
    });
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) { navigate("/login"); return null; }

  // Group matches by jornada
  const matchesByJornada = (matches || []).reduce((acc: Record<number, any[]>, m: any) => {
    const j = m.jornada || 0;
    if (!acc[j]) acc[j] = [];
    acc[j].push(m);
    return acc;
  }, {});

  const jornadas = Object.keys(matchesByJornada).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>

          <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-wide mb-2">ADMIN — GRUPO DEMO</h1>
          <p className="text-sm text-muted-foreground font-body mb-8">Liga MX · Clausura 2026 · Jornadas 13-17</p>

          {/* Reset */}
          <div className="card-elevated rounded-2xl p-6 mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg text-foreground tracking-wider">CONTROLES</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                {matches?.length || 0} partidos · {matches?.filter((m: any) => m.status === "finished").length || 0} finalizados
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" /> Reset Demo
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Resetear Grupo Demo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borrará todas las predicciones y restablecerá todos los marcadores. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => resetDemo.mutate()}>Confirmar reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Matches by Jornada */}
          <div className="space-y-4 mb-8">
            <h2 className="font-display text-xl text-foreground tracking-wider">PARTIDOS POR JORNADA</h2>

            {matchesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              jornadas.map((jornada) => {
                const jornadaMatches = matchesByJornada[jornada];
                const finishedCount = jornadaMatches.filter((m: any) => m.status === "finished").length;
                const isExpanded = expandedJornada === jornada;

                return (
                  <div key={jornada} className="card-elevated rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedJornada(isExpanded ? null : jornada)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display text-foreground tracking-wider">JORNADA {jornada}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {finishedCount}/{jornadaMatches.length} finalizados
                        </Badge>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {jornadaMatches.map((match: any) => {
                          const isFinished = match.status === "finished";
                          const currentScore = scores[match.id] || { home: "", away: "" };
                          const kickoff = new Date(match.kickoff_utc);

                          return (
                            <div key={match.id} className="p-4 border-b border-border last:border-0">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] text-muted-foreground font-body">
                                  {kickoff.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} · {kickoff.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-body">{match.stadium}, {match.city}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 text-right">
                                  <span className="text-sm font-body font-semibold text-foreground">{match.home_team}</span>
                                </div>

                                {isFinished ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge className="bg-primary/10 text-primary font-display text-sm px-3">
                                      {match.home_score} - {match.away_score}
                                    </Badge>
                                    <Check className="w-4 h-4 text-green-500" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="20"
                                      className="w-12 h-8 text-center text-sm p-0"
                                      placeholder="-"
                                      value={currentScore.home}
                                      onChange={(e) => setScores(prev => ({
                                        ...prev,
                                        [match.id]: { ...prev[match.id], home: e.target.value, away: prev[match.id]?.away || "" }
                                      }))}
                                    />
                                    <span className="text-muted-foreground text-xs">-</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="20"
                                      className="w-12 h-8 text-center text-sm p-0"
                                      placeholder="-"
                                      value={currentScore.away}
                                      onChange={(e) => setScores(prev => ({
                                        ...prev,
                                        [match.id]: { home: prev[match.id]?.home || "", away: e.target.value }
                                      }))}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 ml-1"
                                      disabled={updateScore.isPending}
                                      onClick={() => handleSubmitScore(match.id)}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}

                                <div className="flex-1">
                                  <span className="text-sm font-body font-semibold text-foreground">{match.away_team}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Members */}
          <div className="card-elevated rounded-2xl p-6">
            <h2 className="font-display text-xl text-foreground tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> MIEMBROS ({members?.length || 0})
            </h2>
            {members?.length ? (
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{m.displayName}</p>
                      <p className="text-xs text-muted-foreground font-body">{m.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {new Date(m.joined_at).toLocaleDateString("es")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">No hay miembros aún.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DemoAdmin;
