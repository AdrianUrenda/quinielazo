import { motion } from "framer-motion";
import { Trophy, Users, BarChart3, Bell, Zap, UserCheck, Target } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "GRUPOS PRIVADOS",
    description: "Crea tu grupo con amigos, familia o compañeros de trabajo y compite entre ustedes.",
  },
  {
    icon: Trophy,
    title: "PREDICCIONES",
    description: "Predice el marcador exacto de cada partido y acumula puntos por aciertos.",
  },
  {
    icon: BarChart3,
    title: "TABLA EN VIVO",
    description: "Tabla de posiciones actualizada en tiempo real después de cada resultado.",
  },
  {
    icon: UserCheck,
    title: "ADMIN APRUEBA ACCESOS",
    description:
      "El administrador autoriza cada solicitud de ingreso. Ideal para 'vaquitas' entre amigos o familia: cobra la cuota antes de aprobar al miembro.",
  },
  {
    icon: Bell,
    title: "NOTIFICACIONES",
    description: "Recordatorios antes de cada partido para que nunca olvides enviar tu predicción.",
  },
  {
    icon: Zap,
    title: "FÁCIL DE USAR",
    description: "Diseñado para celular. Predice en segundos desde cualquier lugar.",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-4 tracking-wide">
            ¿CÓMO FUNCIONA?
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Todo lo que necesitas para organizar tu quiniela del Mundial 2026
          </p>
        </motion.div>

        {/* Highlighted scoring system card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden mb-6 border-2 border-secondary/40"
          style={{
            background: "var(--gradient-hero)",
            boxShadow: "var(--shadow-gold)",
          }}
        >
          {/* Gold accent overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: "var(--gradient-gold)" }}
          />

          <div className="relative p-8 md:p-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Target className="w-7 h-7 md:w-8 md:h-8 text-secondary" />
              <h3 className="text-3xl md:text-5xl font-display tracking-wide text-secondary">
                SISTEMA DE PUNTOS
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              <div className="rounded-xl p-6 bg-background/95 backdrop-blur border-2 border-secondary/60 text-center">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-display text-gradient-gold leading-none">
                    3
                  </span>
                  <span className="text-2xl md:text-3xl font-display text-secondary">
                    PTS
                  </span>
                </div>
                <p className="text-sm font-display tracking-wider text-foreground mb-1">
                  MARCADOR EXACTO
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Predices 2-1 y termina 2-1
                </p>
              </div>

              <div className="rounded-xl p-6 bg-background/95 backdrop-blur border-2 border-primary/60 text-center">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-display text-primary leading-none">
                    1
                  </span>
                  <span className="text-2xl md:text-3xl font-display text-primary">
                    PT
                  </span>
                </div>
                <p className="text-sm font-display tracking-wider text-foreground mb-1">
                  RESULTADO CORRECTO
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Aciertas ganador o empate, sin marcador exacto
                </p>
              </div>
            </div>

            <p className="text-center text-xs md:text-sm text-primary-foreground/80 font-body mt-5">
              Desempate: gana quien tenga más marcadores exactos a lo largo del torneo.
            </p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card-elevated rounded-xl p-8 group cursor-default"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-display text-foreground mb-2 tracking-wide">{feature.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
