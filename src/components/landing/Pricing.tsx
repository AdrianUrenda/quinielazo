import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";
import { Link } from "react-router-dom";

const sharedFeatures = [
  "Predicciones ilimitadas durante el torneo",
  "Tabla de posiciones del grupo",
  "Notificaciones de partidos y resultados",
  "Link de invitación para compartir",
  "Acceso al Grupo Demo de Liga MX",
];

const tiers = [
  { name: "Básico", price: "$49", members: "Hasta 10 miembros", popular: false, features: sharedFeatures },
  { name: "Familiar", price: "$99", members: "Hasta 20 miembros", popular: true, features: sharedFeatures },
  { name: "Grande", price: "$199", members: "21 miembros o más", popular: false, features: sharedFeatures },
];

const Pricing = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-display text-foreground mb-4 tracking-wide">
            CREA TU GRUPO
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Pago único por todo el Mundial. Sin suscripciones ni cargos recurrentes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative rounded-xl p-8 ${
                tier.popular
                  ? "bg-navy text-primary-foreground ring-2 ring-gold shadow-xl scale-105"
                  : "card-elevated"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gold text-navy px-4 py-1 rounded-full text-sm font-bold font-body">
                  <Star className="w-3 h-3" />
                  MÁS POPULAR
                </div>
              )}

              <h3 className="text-2xl font-display tracking-wide mb-1">{tier.name}</h3>
              <p className={`text-sm mb-4 ${tier.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {tier.members}
              </p>

              <div className="mb-6">
                <span className="text-5xl font-display">{tier.price}</span>
                <span className={`text-sm ml-1 ${tier.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  MXN
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm font-body">
                    <Check className={`w-4 h-4 flex-shrink-0 ${tier.popular ? "text-gold" : "text-primary"}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.popular ? "hero" : "default"}
                className="w-full"
                asChild
              >
                <Link to="/register">Crear grupo</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
