import { motion } from "framer-motion";
import { Play, Smartphone, Users, Trophy } from "lucide-react";

const DemoVideoPlaceholder = () => {
  return (
    <section className="pb-24 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-10">
            <p className="text-sm font-body font-semibold uppercase tracking-wide text-primary mb-3">
              Demo de la aplicación
            </p>
            <h2 className="text-4xl md:text-6xl font-display text-foreground mb-4 tracking-wide">
              MIRA CÓMO SE JUEGA
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
              Próximamente: un recorrido rápido para crear tu grupo, invitar amigos y enviar predicciones.
            </p>
          </div>

          <div className="card-elevated rounded-xl p-3 md:p-4">
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-navy">
              <div className="absolute inset-0 opacity-25">
                <div className="absolute left-1/2 top-0 h-full w-px bg-primary-foreground/60" />
                <div className="absolute left-[12%] top-1/2 h-[56%] w-[18%] -translate-y-1/2 rounded-r-lg border border-primary-foreground/60 border-l-0" />
                <div className="absolute right-[12%] top-1/2 h-[56%] w-[18%] -translate-y-1/2 rounded-l-lg border border-primary-foreground/60 border-r-0" />
                <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary-foreground/60" />
              </div>

              <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3 rounded-md border border-primary-foreground/10 bg-background/10 px-3 py-2 backdrop-blur-sm md:inset-x-6 md:top-6">
                <div className="flex items-center gap-2 text-primary-foreground">
                  <Smartphone className="w-4 h-4 text-gold" />
                  <span className="font-body text-xs font-semibold uppercase tracking-wide md:text-sm">
                    Quinielazo demo
                  </span>
                </div>
                <span className="rounded-full bg-gold px-3 py-1 font-body text-xs font-bold text-gold-foreground">
                  Próximamente
                </span>
              </div>

              <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
                <button
                  type="button"
                  aria-label="Video demo próximamente"
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gold text-accent-foreground shadow-[var(--shadow-gold)] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:h-24 md:w-24"
                >
                  <Play className="ml-1 h-9 w-9 fill-current md:h-11 md:w-11" />
                </button>
                <h3 className="text-3xl font-display tracking-wide text-primary-foreground md:text-5xl">
                  VIDEO DEMO PRÓXIMAMENTE
                </h3>
                <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-primary-foreground/80 md:text-base">
                  Este espacio mostrará el flujo completo: crea tu quiniela, comparte el enlace y compite durante el Mundial.
                </p>
              </div>

              <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2 md:inset-x-6 md:bottom-6 md:flex md:justify-center">
                {[
                  { icon: Users, label: "Crear grupo" },
                  { icon: Trophy, label: "Sumar puntos" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-center gap-2 rounded-md border border-primary-foreground/10 bg-background/10 px-3 py-2 text-primary-foreground backdrop-blur-sm"
                  >
                    <item.icon className="h-4 w-4 text-gold" />
                    <span className="font-body text-xs font-semibold md:text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoVideoPlaceholder;
