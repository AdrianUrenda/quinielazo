import { Calendar, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const matches = [
  { id: 1, stage: "Grupo A", home: "🇲🇽 México", away: "TBD", date: "11 Jun 2026", time: "18:00", stadium: "Estadio Azteca", city: "CDMX", status: "upcoming" as const },
  { id: 2, stage: "Grupo A", home: "🇺🇸 Estados Unidos", away: "TBD", date: "11 Jun 2026", time: "20:00", stadium: "MetLife Stadium", city: "New York", status: "upcoming" as const },
  { id: 3, stage: "Grupo B", home: "🇦🇷 Argentina", away: "TBD", date: "12 Jun 2026", time: "16:00", stadium: "Hard Rock Stadium", city: "Miami", status: "upcoming" as const },
  { id: 4, stage: "Grupo B", home: "🇧🇷 Brasil", away: "TBD", date: "12 Jun 2026", time: "19:00", stadium: "AT&T Stadium", city: "Dallas", status: "upcoming" as const },
  { id: 5, stage: "Grupo C", home: "🇫🇷 Francia", away: "TBD", date: "13 Jun 2026", time: "17:00", stadium: "BMO Field", city: "Toronto", status: "upcoming" as const },
  { id: 6, stage: "Grupo C", home: "🇩🇪 Alemania", away: "TBD", date: "13 Jun 2026", time: "20:00", stadium: "SoFi Stadium", city: "Los Ángeles", status: "upcoming" as const },
  { id: 7, stage: "Grupo D", home: "🇪🇸 España", away: "TBD", date: "14 Jun 2026", time: "16:00", stadium: "Lincoln Financial Field", city: "Philadelphia", status: "upcoming" as const },
  { id: 8, stage: "Grupo D", home: "🇬🇧 Inglaterra", away: "TBD", date: "14 Jun 2026", time: "19:00", stadium: "Lumen Field", city: "Seattle", status: "upcoming" as const },
];

const statusBadge = {
  upcoming: { text: "Próximo", class: "bg-primary/10 text-primary" },
  live: { text: "EN VIVO", class: "bg-mexico-red/10 text-mexico-red" },
  finished: { text: "Finalizado", class: "bg-muted text-muted-foreground" },
};

const MatchCalendar = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-display text-foreground tracking-wide mb-4">CALENDARIO</h1>
            <p className="text-lg text-muted-foreground font-body">FIFA World Cup 2026 — USA, México y Canadá</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {matches.map((match, index) => {
              const badge = statusBadge[match.status];
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card-elevated rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-display tracking-wider text-primary">{match.stage}</span>
                    <span className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-4 mb-3 font-body font-semibold text-foreground text-lg">
                    <span className="text-right flex-1">{match.home}</span>
                    <span className="text-sm px-3 py-1 rounded-full bg-muted text-muted-foreground font-display">VS</span>
                    <span className="text-left flex-1">{match.away}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{match.date} · {match.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{match.stadium}, {match.city}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center mt-8 text-sm text-muted-foreground font-body">
            * Calendario preliminar. Se actualizará con el sorteo oficial de la FIFA.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MatchCalendar;
