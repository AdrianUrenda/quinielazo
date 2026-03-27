import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-[800px] mx-auto px-4 font-body">
          <h1 className="font-display text-3xl md:text-4xl text-primary-foreground mb-2 tracking-wider">
            TÉRMINOS Y CONDICIONES DE USO
          </h1>
          <p className="text-muted-foreground text-sm mb-10">Última actualización: marzo de 2026</p>

          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Bienvenido a Quinielazo 2026 (en adelante, "la Plataforma"), operada por sus creadores (en adelante, "nosotros" o "el Operador"). Al registrarte y utilizar esta plataforma, aceptas los presentes Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna de estas condiciones, te pedimos que no utilices la Plataforma.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">1. Descripción del servicio</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Quinielazo 2026 es una plataforma digital de entretenimiento que permite a los usuarios registrados crear grupos privados y realizar predicciones sobre los resultados de partidos de fútbol, incluyendo los de la Copa del Mundo FIFA 2026 y competiciones de demostración como la Liga MX. La Plataforma no ofrece premios en dinero, apuestas ni cualquier forma de juego de azar regulado. Se trata exclusivamente de una quiniela de entretenimiento entre amigos y familiares.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">2. Registro y cuenta de usuario</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Para acceder a las funcionalidades de la Plataforma, es necesario crear una cuenta con un correo electrónico válido y una contraseña. El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas bajo su cuenta. Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estos Términos.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">3. Creación de grupos y pagos</h2>
          <p className="mb-4 text-primary-foreground/80 leading-relaxed">
            La creación de grupos privados en la Plataforma requiere el pago de una tarifa única, no recurrente, correspondiente al tamaño del grupo seleccionado:
          </p>
          <ul className="list-disc pl-6 mb-4 text-primary-foreground/80 space-y-1">
            <li>Básico (hasta 10 miembros): $49 MXN</li>
            <li>Familiar (hasta 20 miembros): $99 MXN</li>
            <li>Grande (21 miembros o más): $199 MXN</li>
          </ul>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Los pagos son procesados de forma segura a través de Stripe. Al completar un pago, el usuario acepta también los Términos de Servicio de Stripe disponibles en stripe.com. Una vez confirmado el pago y creado el grupo, no se realizarán reembolsos, salvo en los casos descritos en la Sección 9 de estos Términos.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">4. Grupo Demo</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            La Plataforma ofrece un Grupo Demo de acceso gratuito y abierto a todos los usuarios registrados, con partidos de la Liga MX Clausura 2025. Este grupo tiene fines exclusivamente demostrativos. No existe ninguna obligación de permanencia, y el Operador puede modificar, reiniciar o eliminar el Grupo Demo en cualquier momento sin previo aviso.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">5. Sistema de predicciones y puntuación</h2>
          <p className="mb-4 text-primary-foreground/80 leading-relaxed">
            El sistema de puntuación de Quinielazo 2026 funciona de la siguiente manera:
          </p>
          <ul className="list-disc pl-6 mb-4 text-primary-foreground/80 space-y-1">
            <li>1 punto por predecir correctamente el resultado (victoria local, empate o victoria visitante).</li>
            <li>3 puntos por predecir correctamente el marcador exacto (goles de ambos equipos).</li>
          </ul>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Las predicciones deben enviarse antes del inicio oficial del partido. Una vez iniciado el partido, las predicciones quedan bloqueadas y no pueden modificarse. El Operador no se hace responsable de errores en el registro de resultados atribuibles a retrasos o inconsistencias en las fuentes de datos externas utilizadas.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">6. Responsabilidades del Administrador de grupo</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            El usuario que crea un grupo privado asume el rol de Administrador y es responsable de: (a) gestionar las solicitudes de acceso de otros usuarios; (b) asegurarse de que los miembros invitados sean personas conocidas; (c) el uso apropiado del código de acceso del grupo, si decide configurarlo. El Operador no interviene en las disputas entre miembros de un grupo privado.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">7. Conducta del usuario</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            El usuario se compromete a utilizar la Plataforma de manera lícita y respetuosa. Está prohibido: (a) utilizar la Plataforma con fines comerciales no autorizados; (b) intentar acceder a cuentas o grupos de otros usuarios sin autorización; (c) introducir datos falsos, contenido ofensivo o spam en la Plataforma; (d) realizar ingeniería inversa, scraping o cualquier extracción automatizada de datos.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">8. Propiedad intelectual</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Todos los contenidos de la Plataforma, incluyendo diseño, código, textos e imágenes, son propiedad del Operador o de sus licenciantes. Los datos de partidos de fútbol son proporcionados por terceros (API-Football / API-Sports) bajo sus propias condiciones de uso. Los logotipos y marcas de la FIFA y de la Liga MX pertenecen a sus respectivos titulares y no implican patrocinio ni afiliación oficial con Quinielazo 2026.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">9. Política de reembolsos</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Dado que el pago activa de forma inmediata la creación del grupo y sus funcionalidades, no se ofrecen reembolsos una vez completada la transacción. Excepcionalmente, se considerará un reembolso en los siguientes casos: (a) cobro duplicado demostrable; (b) fallo técnico documentado imputable exclusivamente a la Plataforma que impida al usuario acceder al grupo creado. Las solicitudes de reembolso deben enviarse a través del canal de contacto oficial dentro de los 7 días naturales siguientes al pago.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">10. Limitación de responsabilidad</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            La Plataforma se ofrece "tal cual" y el Operador no garantiza disponibilidad ininterrumpida del servicio. En ningún caso el Operador será responsable por daños indirectos, pérdida de datos o perjuicios derivados del uso o la imposibilidad de uso de la Plataforma. La responsabilidad máxima del Operador frente a cualquier usuario no excederá el importe pagado por dicho usuario en los últimos 12 meses.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">11. Modificaciones</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en esta página. El uso continuado de la Plataforma tras la publicación de cambios implica la aceptación de los nuevos Términos.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">12. Ley aplicable</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia derivada de su interpretación o cumplimiento se someterá a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando las partes a cualquier otro fuero que pudiera corresponderles.
          </p>

          <h2 className="font-display text-xl text-primary-foreground mt-10 mb-3">13. Contacto</h2>
          <p className="mb-6 text-primary-foreground/80 leading-relaxed">
            Para cualquier consulta relacionada con estos Términos, puedes contactarnos a través de la sección de contacto disponible en la Plataforma.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
