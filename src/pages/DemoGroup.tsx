import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ClipboardList, ArrowLeft, Users, Loader2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import DemoPredictionsTab from "@/components/demo/DemoPredictionsTab";
import DemoLeaderboardTab from "@/components/demo/DemoLeaderboardTab";

const DemoGroup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const { data: membership, isLoading: memberLoading } = useQuery({
    queryKey: ["demo-membership", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("demo_group_members")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: memberCount } = useQuery({
    queryKey: ["demo-member-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("demo_group_members")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  if (authLoading || memberLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (!membership) {
    navigate("/groups");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate("/groups")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Mis Grupos
            </Button>

            <div className="card-elevated rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display text-foreground tracking-wide">
                    GRUPO DEMO — LIGA MX
                  </h1>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Apertura 2024 · {memberCount} participantes
                  </p>
                </div>
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-display text-xs shrink-0">
                  DEMO
                </Badge>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="predictions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="predictions" className="font-display tracking-wider text-xs gap-1.5">
                <ClipboardList className="w-4 h-4" /> PARTIDOS
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="font-display tracking-wider text-xs gap-1.5">
                <BarChart3 className="w-4 h-4" /> POSICIONES
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions">
              <DemoPredictionsTab userId={user.id} />
            </TabsContent>

            <TabsContent value="leaderboard">
              <DemoLeaderboardTab currentUserId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DemoGroup;
