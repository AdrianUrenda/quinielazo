/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ArrowLeft, Users, Trash2, Loader2, Check, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { formatMexicoDateTime } from "@/lib/matchCalendar";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

const roundMeta: Record<string, { label: string; order: number }> = {
  reclassification: { label: "Reclasificación", order: 0 },
  quarterfinal: { label: "Cuartos de Final", order: 1 },
  semifinal: { label: "Semifinales", order: 2 },
  final: { label: "Final", order: 3 },
};

const getDemoStage = (match: any) => {
  const value = (match.round_label || "").toLowerCase();
  if (value.includes("reclas") || value.includes("relegation round")) return "reclassification";
  if (value.includes("quarter") || value.includes("cuarto")) return "quarterfinal";
  if (value.includes("semi")) return "semifinal";
  if (value.includes("final")) return "final";
  return "other";
};

const DemoAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
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
        .order("round_order", { ascending: true, nullsFirst: false })
        .order("kickoff_utc", { ascending: true });
      return (data || []) as any[];
    },
  });

  const invokeSync = async (action: string, body?: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    const resp = await fetch(`https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/demo-sync?action=${action}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Error");
    return result;
  };

  const updateScore = useMutation({
    mutationFn: (params: { matchId: string; homeScore: number; awayScore: number }) => invokeSync("update-score", params),
    onSuccess: (data) => {
      toast.success(`Marcador registrado. ${data.predictionsScored} predicciones puntuadas.`);
      queryClient.invalidateQueries({ queryKey: ["demo-admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["demo-matches"] });
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
      queryClient.invalidateQueries({ queryKey: ["demo-matches"] });
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
    updateScore.mutate({ matchId, homeScore: parseInt(s.home), awayScore: parseInt(s.away) });
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) { navigate("/login"); return null; }

  const liguillaMatches = (matches || []).filter((m) => m.round_label || (m.jornada ?? 0) >= 900);
  const matchesByRound = liguillaMatches.reduce((acc: Record<string, any[]>, match: any) => {
    const stage = getDemoStage(match);
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(match);
    return acc;
  }, {});
  const rounds = Object.keys(matchesByRound).sort((a, b) => (roundMeta[a]?.order ?? 9) - (roundMeta[b]?.order ?? 9));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>

          <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-wide mb-2">ADMIN — GRUPO DEMO</h1>
          <p className="text-sm text-muted-foreground font-body mb-8">Liga MX · Liguilla · Validación de resultados</p>

          <div className="card-elevated rounded-2xl p-6 mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg text-foreground tracking-wider">CONTROLES</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">{liguillaMatches.length} partidos de Liguilla · {rounds.length} rondas</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4 mr-2" /> Reset Demo</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Resetear Grupo Demo?</AlertDialogTitle>
                  <AlertDialogDescription>Esto borrará todas las predicciones y restablecerá todos los marcadores. No se puede deshacer.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => resetDemo.mutate()}>Confirmar reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="space-y-4 mb-8">
            <h2 className="font-display text-xl text-foreground tracking-wider">PARTIDOS POR RONDA</h2>

            {matchesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              rounds.map((round) => {
                const roundMatches = matchesByRound[round];
                const finishedCount = roundMatches.filter((m: any) => m.status === "finished").length;
                const isExpanded = expandedRound === round;

                return (
                  <div key={round} className="card-elevated rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedRound(isExpanded ? null : round)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-4 h-4 text-gold" />
                        <span className="font-display text-foreground tracking-wider">{roundMeta[round]?.label || "Liguilla"}</span>
                        <Badge variant="outline" className="text-[10px]">{finishedCount}/{roundMatches.length} finalizados</Badge>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {roundMatches.map((match: any) => {
                          const isFinished = match.status === "finished";
                          const currentScore = scores[match.id] || { home: "", away: "" };

                          return (
                            <div key={match.id} className="p-4 border-b border-border last:border-0">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="text-[10px] text-muted-foreground font-body">{match.leg_label ? `${match.leg_label} · ` : ""}{formatMexicoDateTime(match.kickoff_utc)}</p>
                                <Badge variant={isFinished ? "default" : "outline"} className="text-[10px]">{isFinished ? "Finalizado" : "Pendiente"}</Badge>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex-1 text-right min-w-0"><span className="text-sm font-body font-semibold text-foreground truncate block">{match.home_team}</span></div>

                                {isFinished ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge className="bg-primary/10 text-primary font-display text-sm px-3">{match.home_score} - {match.away_score}</Badge>
                                    <Check className="w-4 h-4 text-primary" />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Input type="number" min="0" max="20" className="w-12 h-8 text-center text-sm p-0" placeholder="-" value={currentScore.home} onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { ...prev[match.id], home: e.target.value, away: prev[match.id]?.away || "" } }))} />
                                    <span className="text-muted-foreground text-xs">-</span>
                                    <Input type="number" min="0" max="20" className="w-12 h-8 text-center text-sm p-0" placeholder="-" value={currentScore.away} onChange={(e) => setScores((prev) => ({ ...prev, [match.id]: { home: prev[match.id]?.home || "", away: e.target.value } }))} />
                                  </div>
                                )}

                                <div className="flex-1 min-w-0"><span className="text-sm font-body font-semibold text-foreground truncate block">{match.away_team}</span></div>

                                {!isFinished && (
                                  <Button size="sm" variant="outline" className="h-8 px-2 ml-2 shrink-0" disabled={updateScore.isPending} onClick={() => handleSubmitScore(match.id)}>
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
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

          <div className="card-elevated rounded-2xl p-6">
            <h2 className="font-display text-xl text-foreground tracking-wider mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> MIEMBROS ({members?.length || 0})</h2>
            {members?.length ? (
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-body font-semibold text-foreground">{m.displayName}</p>
                      <p className="text-xs text-muted-foreground font-body">{m.email}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{new Date(m.joined_at).toLocaleDateString("es")}</Badge>
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
