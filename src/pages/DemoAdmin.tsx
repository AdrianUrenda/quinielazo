import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, RefreshCw, Users, Trash2, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

const DemoAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: matchCount } = useQuery({
    queryKey: ["demo-admin-match-count"],
    queryFn: async () => {
      const { count } = await supabase.from("demo_matches").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const invokeSync = async (action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");
    const resp = await fetch(
      `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/demo-sync?action=${action}`,
      { headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" } }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Error");
    return result;
  };

  const syncFixtures = useMutation({
    mutationFn: () => invokeSync("sync-fixtures"),
    onSuccess: (data) => {
      toast.success(`Fixtures sincronizados: ${data.synced}`);
      queryClient.invalidateQueries({ queryKey: ["demo-admin-match-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncResults = useMutation({
    mutationFn: () => invokeSync("sync-results"),
    onSuccess: (data) => {
      toast.success(`Resultados procesados: ${data.scored}`);
      queryClient.invalidateQueries({ queryKey: ["demo-matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetDemo = useMutation({
    mutationFn: () => invokeSync("reset"),
    onSuccess: () => {
      toast.success("Predicciones del demo borradas");
      queryClient.invalidateQueries({ queryKey: ["demo-predictions"] });
      queryClient.invalidateQueries({ queryKey: ["demo-leaderboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) { navigate("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>

          <h1 className="text-4xl font-display text-foreground tracking-wide mb-8">ADMIN — GRUPO DEMO</h1>

          {/* Sync controls */}
          <div className="card-elevated rounded-2xl p-6 space-y-4 mb-6">
            <h2 className="font-display text-xl text-foreground tracking-wider">SINCRONIZACIÓN</h2>
            <p className="text-sm text-muted-foreground font-body">Fixtures cargados: <strong>{matchCount}</strong></p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => syncFixtures.mutate()} disabled={syncFixtures.isPending}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncFixtures.isPending ? "animate-spin" : ""}`} />
                Sincronizar fixtures
              </Button>
              <Button variant="outline" onClick={() => syncResults.mutate()} disabled={syncResults.isPending}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncResults.isPending ? "animate-spin" : ""}`} />
                Sincronizar resultados
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" /> Reset Demo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Resetear Grupo Demo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esto borrará todas las predicciones del demo. Los miembros no serán removidos. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetDemo.mutate()}>Confirmar reset</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
