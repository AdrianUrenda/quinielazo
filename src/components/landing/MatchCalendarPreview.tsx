import { Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";

// Sample group stage matches for the landing preview
const sampleMatches = [
  { id: 1, stage: "Fase de Grupos", home: "🇲🇽 México", away: "🇨🇦 Canadá", date: "11 Jun 2026", time: "18:00", stadium: "Estadio Azteca", city: "CDMX" },
  { id: 2, stage: "Fase de Grupos", home: "🇺🇸 Estados Unidos", away: "🇧🇷 Brasil", date: "11 Jun 2026", time: "20:00", stadium: "MetLife Stadium", city: "New York" },
  { id: 3, stage: "Fase de Grupos", home: "🇦🇷 Argentina", away: "🇫🇷 Francia", date: "12 Jun 2026", time: "16:00", stadium: "Hard Rock Stadium", city: "Miami" },
  { id: 4, stage: "Fase de Grupos", home: "🇩🇪 Alemania", away: "🇪🇸 España", date: "12 Jun 2026", time: "19:00", stadium: "AT&T Stadium", city: "Dallas" },
  { id: 5, stage: "Fase de Grupos", home: "🇬🇧 Inglaterra", away: "🇳🇱 Países Bajos", date: "13 Jun 2026", time: "17:00", stadium: "BMO Field", city: "Toronto" },
  { id: 6, stage: "Fase de Grupos", home: "🇵🇹 Portugal", away: "🇮🇹 Italia", date: "13 Jun 2026", time: "20:00", stadium: "SoFi Stadium", city: "Los Ángeles" },
];

const MatchCalendarPreview = () => {
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
          {sampleMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="card-elevated rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              <div className="flex items-center gap-3 text-sm text-muted-foreground font-body min-w-[140px]">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{match.date}</span>
                <span className="text-gold font-semibold">{match.time}</span>
              </div>

              <div className="flex-1 flex items-center justify-center gap-4 font-body font-semibold text-foreground">
                <span className="text-right flex-1">{match.home}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground font-display text-base">
                  VS
                </span>
                <span className="text-left flex-1">{match.away}</span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground font-body min-w-[140px] justify-end">
                <MapPin className="w-3 h-3" />
                <span>{match.city}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8 text-sm text-muted-foreground font-body"
        >
          * Partidos de ejemplo. El calendario completo estará disponible próximamente.
        </motion.p>
      </div>
    </section>
  );
};

export default MatchCalendarPreview;
