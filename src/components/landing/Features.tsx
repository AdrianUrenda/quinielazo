import { motion } from "framer-motion";
import { Trophy, Shield, Users, BarChart3, Bell, Zap } from "lucide-react";

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
    icon: Shield,
    title: "SISTEMA JUSTO",
    description: "1 punto por acertar resultado, 3 puntos por marcador exacto. Simple y claro.",
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
