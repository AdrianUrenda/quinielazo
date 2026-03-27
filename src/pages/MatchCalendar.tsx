import { Calendar, MapPin, Filter, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useMemo } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MatchStage = "group" | "round_of_32" | "round_of_16" | "quarterfinal" | "semifinal" | "third_place" | "final";

const stageLabels: Record<MatchStage, string> = {
  group: "Fase de Grupos",
  round_of_32: "Treintaidosavos",
  round_of_16: "Octavos de Final",
  quarterfinal: "Cuartos de Final",
  semifinal: "Semifinal",
  third_place: "Tercer Lugar",
  final: "Final",
};

const stageFilters: { value: string; label: string }[] = [
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

const statusConfig = {
  upcoming: { text: "Próximo", className: "bg-primary/10 text-primary border-primary/20" },
  live: { text: "EN VIVO", className: "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" },
  finished: { text: "Finalizado", className: "bg-muted text-muted-foreground border-border" },
};

const MatchCalendar = () => {
  const [stageFilter, setStageFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff_utc", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!matches) return [];
    return matches.filter((m) => {
      if (stageFilter !== "all" && m.stage !== stageFilter) return false;
      if (groupFilter !== "all" && m.group_label !== groupFilter) return false;
      return true;
    });
  }, [matches, stageFilter, groupFilter]);

  // Group matches by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((m) => {
      const dateKey = format(new Date(m.kickoff_utc), "yyyy-MM-dd");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(m);
    });
    return groups;
  }, [filtered]);

  const formatTime = (utc: string) => format(new Date(utc), "HH:mm");
  const formatDateHeader = (dateKey: string) => {
    const d = new Date(dateKey + "T12:00:00");
    return format(d, "EEEE d 'de' MMMM, yyyy", { locale: es });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-display text-foreground tracking-wide mb-2">CALENDARIO</h1>
            <p className="text-lg text-muted-foreground font-body">
              FIFA World Cup 2026™ — 11 Jun – 19 Jul
            </p>
            {matches && (
              <p className="text-sm text-muted-foreground font-body mt-1">
                {filtered.length} de {matches.length} partidos
              </p>
            )}
          </div>

          {/* Stage Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {stageFilters.map((f) => (
              <Button
                key={f.value}
                variant={stageFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStageFilter(f.value);
                  if (f.value !== "group") setGroupFilter("all");
                }}
                className="text-xs"
              >
                {f.label}
              </Button>
            ))}
          </div>

          {/* Group Filters (only show when stage is group or all) */}
          {(stageFilter === "all" || stageFilter === "group") && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-8">
              {groupFilters.map((g) => (
                <Button
                  key={g}
                  variant={groupFilter === g ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setGroupFilter(g)}
                  className="text-xs h-7 px-2.5"
                >
                  {g === "all" ? "Todos" : `Grupo ${g}`}
                </Button>
              ))}
            </div>
          )}

          {/* Matches */}
          <div className="max-w-3xl mx-auto">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card-elevated rounded-xl p-5 animate-pulse h-24" />
                ))}
              </div>
            ) : Object.keys(groupedByDate).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-body">
                <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>No se encontraron partidos con estos filtros.</p>
              </div>
            ) : (
              Object.entries(groupedByDate).map(([dateKey, dayMatches]) => (
                <div key={dateKey} className="mb-8">
                  <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm py-3 mb-3 border-b border-border">
                    <h3 className="text-sm font-display tracking-wider text-primary uppercase">
                      {formatDateHeader(dateKey)}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {dayMatches.map((match, index) => {
                      const status = statusConfig[match.status as keyof typeof statusConfig];
                      const stageLabel = stageLabels[match.stage as MatchStage];
                      const isKnockout = match.stage !== "group";

                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="card-elevated rounded-xl p-4 sm:p-5"
                        >
                          {/* Top row: stage + status */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {isKnockout && <Trophy className="w-3 h-3 text-gold" />}
                              <span className="text-xs font-display tracking-wider text-primary">
                                {match.group_label ? `Grupo ${match.group_label}` : stageLabel}
                              </span>
                              <span className="text-xs text-muted-foreground font-body">
                                · M{match.match_number}
                              </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                              {status.text}
                            </Badge>
                          </div>

                          {/* Teams */}
                          <div className="flex items-center justify-center gap-3 mb-3">
                            <span className="text-right flex-1 font-body font-semibold text-foreground text-sm sm:text-base truncate">
                              {match.home_flag} {match.home_team}
                            </span>
                            {match.status === "finished" ? (
                              <span className="font-display text-lg px-3 text-foreground">
                                {match.home_score} - {match.away_score}
                              </span>
                            ) : (
                              <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-display text-sm">
                                {formatTime(match.kickoff_utc)}
                              </span>
                            )}
                            <span className="text-left flex-1 font-body font-semibold text-foreground text-sm sm:text-base truncate">
                              {match.away_team} {match.away_flag}
                            </span>
                          </div>

                          {/* Bottom row: venue */}
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-body">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{match.stadium}, {match.city}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MatchCalendar;
