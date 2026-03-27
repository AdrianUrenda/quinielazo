import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Users, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] bg-hero overflow-hidden flex items-center">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gold blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-pitch-light blur-3xl" />
      </div>

      {/* Pitch lines pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-primary-foreground" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-primary-foreground" />
      </div>

      <div className="container relative z-10 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 text-gold mb-8"
          >
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-semibold font-body tracking-wide">FIFA World Cup 2026</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display text-primary-foreground leading-none mb-4 tracking-wide">
            QUINIELAZO
          </h1>
          <p className="text-2xl md:text-3xl font-display text-gold tracking-wider mb-2">
            2026
          </p>
          <p className="text-lg md:text-xl text-primary-foreground/70 font-body mb-10 max-w-xl mx-auto">
            Predice resultados, compite con tu familia y amigos, y demuestra quién sabe más de fútbol.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/register">
                <Users className="w-5 h-5" />
                Crear mi grupo
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/calendar">
                <Calendar className="w-5 h-5" />
                Ver calendario
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            {[
              { value: "104", label: "Partidos" },
              { value: "48", label: "Selecciones" },
              { value: "3", label: "Países sede" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-display text-gold">{stat.value}</p>
                <p className="text-sm text-primary-foreground/60 font-body">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
