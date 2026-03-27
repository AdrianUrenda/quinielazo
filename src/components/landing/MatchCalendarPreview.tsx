import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MatchCalendarPreview = () => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("stage", "group")
        .order("kickoff_utc", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const formatDate = (utc: string) => {
    const d = new Date(utc);
    return format(d, "d MMM yyyy", { locale: es });
  };

  const formatTime = (utc: string) => {
    const d = new Date(utc);
    return format(d, "HH:mm");
  };

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-4 tracking-wide">
            CALENDARIO
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            104 partidos, 48 selecciones, 3 países. El Mundial más grande de la historia.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-elevated rounded-xl p-5 animate-pulse h-20" />
              ))
            : matches?.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="card-elevated rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-3 text-sm text-muted-foreground font-body min-w-[160px]">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{formatDate(match.kickoff_utc)}</span>
                    <span className="text-gold font-semibold">{formatTime(match.kickoff_utc)}</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-3 font-body font-semibold text-foreground">
                    <span className="text-right flex-1 text-sm sm:text-base">
                      {match.home_flag} {match.home_team}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-display text-base">
                      VS
                    </span>
                    <span className="text-left flex-1 text-sm sm:text-base">
                      {match.away_flag} {match.away_team}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground font-body min-w-[120px] justify-end">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{match.city}</span>
                  </div>
                </motion.div>
              ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/calendar" className="gap-2">
              Ver los 104 partidos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default MatchCalendarPreview;
