import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-[800px] mx-auto px-4 font-body">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2 tracking-wider">
            AVISO DE PRIVACIDAD
          </h1>
          <p className="text-muted-foreground text-sm mb-10">Última actualización: marzo de 2026</p>

          <p className="mb-6 text-muted-foreground leading-relaxed">
            En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento, el Operador de Quinielazo 2026 pone a tu disposición el presente Aviso de Privacidad.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">1. Responsable del tratamiento de datos</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            El responsable del tratamiento de tus datos personales es el Operador de Quinielazo 2026. Para ejercer tus derechos ARCO (Acceso, Rectificación, Cancelación u Oposición), puedes contactarnos a través del formulario de contacto disponible en la Plataforma.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">2. Datos personales que recopilamos</h2>
          <p className="mb-4 text-muted-foreground leading-relaxed">Recopilamos los siguientes datos personales:</p>

          <h3 className="font-display text-lg text-foreground mt-6 mb-2">Datos proporcionados directamente por ti:</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
            <li>Nombre o nombre de usuario (display name)</li>
            <li>Dirección de correo electrónico</li>
            <li>Contraseña (almacenada en formato cifrado; nunca en texto plano)</li>
            <li>Foto de perfil o imagen de grupo (opcional, si decides cargarla)</li>
          </ul>

          <h3 className="font-display text-lg text-foreground mt-6 mb-2">Datos generados por el uso de la Plataforma:</h3>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
            <li>Predicciones de partidos realizadas</li>
            <li>Grupos creados o a los que perteneces</li>
            <li>Historial de puntuación</li>
            <li>Fecha y hora de registro y de último acceso</li>
          </ul>

          <h3 className="font-display text-lg text-foreground mt-6 mb-2">Datos de pago:</h3>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Los datos de tarjeta de crédito o débito no son almacenados por Quinielazo 2026. Son procesados directamente por Stripe, Inc., un proveedor de pagos certificado PCI DSS. Únicamente conservamos el identificador de transacción proporcionado por Stripe como comprobante del pago.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">3. Finalidades del tratamiento</h2>
          <p className="mb-4 text-muted-foreground leading-relaxed">
            Tus datos personales son utilizados para las siguientes finalidades primarias (necesarias para la prestación del servicio):
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
            <li>Crear y gestionar tu cuenta de usuario</li>
            <li>Permitirte unirte o crear grupos de quiniela</li>
            <li>Registrar y calcular tus predicciones y puntuaciones</li>
            <li>Procesar los pagos por creación de grupos</li>
            <li>Enviarte notificaciones relacionadas con el servicio (aprobación de solicitudes, recordatorios de partidos, resultados)</li>
          </ul>
          <p className="mb-4 text-muted-foreground leading-relaxed">
            Y para las siguientes finalidades secundarias (no necesarias para el servicio, pero que mejoran tu experiencia):
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
            <li>Estadísticas agregadas y anónimas sobre el uso de la Plataforma</li>
            <li>Mejoras al producto basadas en patrones de uso</li>
          </ul>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Puedes oponerte al tratamiento para finalidades secundarias escribiéndonos al canal de contacto oficial.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">4. Transferencia de datos a terceros</h2>
          <p className="mb-4 text-muted-foreground leading-relaxed">
            Quinielazo 2026 no vende ni cede tus datos personales a terceros con fines comerciales. Compartimos datos únicamente con los siguientes proveedores de servicios, en la medida estrictamente necesaria para operar la Plataforma:
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm text-muted-foreground border border-border rounded-md">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left p-3 border-b border-border font-semibold text-foreground">Proveedor</th>
                  <th className="text-left p-3 border-b border-border font-semibold text-foreground">Finalidad</th>
                  <th className="text-left p-3 border-b border-border font-semibold text-foreground">País</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-3">Stripe, Inc.</td>
                  <td className="p-3">Procesamiento de pagos</td>
                  <td className="p-3">Estados Unidos</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Supabase, Inc.</td>
                  <td className="p-3">Almacenamiento de base de datos y autenticación</td>
                  <td className="p-3">Estados Unidos</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-3">Vercel, Inc.</td>
                  <td className="p-3">Hospedaje y despliegue de la aplicación</td>
                  <td className="p-3">Estados Unidos</td>
                </tr>
                <tr>
                  <td className="p-3">API-Sports (API-Football)</td>
                  <td className="p-3">Datos de partidos de fútbol</td>
                  <td className="p-3">Francia</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Estos proveedores actúan como encargados del tratamiento y están sujetos a sus propias políticas de privacidad y, en el caso de proveedores en Estados Unidos, a los marcos de transferencia internacional de datos aplicables.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">5. Cookies y tecnologías de seguimiento</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            La Plataforma utiliza cookies técnicas estrictamente necesarias para el funcionamiento del servicio (por ejemplo, para mantener tu sesión activa). No utilizamos cookies de seguimiento publicitario ni compartimos datos de navegación con redes publicitarias. Al usar la Plataforma, aceptas el uso de estas cookies técnicas.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">6. Seguridad de los datos</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Implementamos medidas técnicas y organizativas razonables para proteger tus datos personales contra acceso no autorizado, pérdida o divulgación, incluyendo: cifrado de contraseñas mediante hashing seguro (bcrypt), transmisión de datos bajo protocolo HTTPS/TLS, y control de acceso basado en roles dentro de la Plataforma.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">7. Derechos ARCO</h2>
          <p className="mb-4 text-muted-foreground leading-relaxed">
            Como titular de tus datos personales, tienes derecho a:
          </p>
          <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
            <li><strong>Acceso:</strong> Conocer qué datos personales tuyos tratamos.</li>
            <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos o incompletos.</li>
            <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos cuando ya no sean necesarios para las finalidades descritas.</li>
            <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos para finalidades secundarias.</li>
          </ul>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Para ejercer cualquiera de estos derechos, contáctanos a través del canal oficial de la Plataforma. Responderemos tu solicitud en un plazo máximo de 20 días hábiles, conforme a lo establecido por la LFPDPPP.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">8. Eliminación de cuenta y datos</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Puedes solicitar la eliminación de tu cuenta y de los datos personales asociados en cualquier momento. Ten en cuenta que los datos anónimos o agregados (como estadísticas de uso sin identificador personal) podrán conservarse para fines estadísticos. La eliminación de tu cuenta no afecta los grupos que hayas creado — estos permanecerán activos para sus otros miembros, pero dejarán de estar asociados a tu perfil de forma identificable.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">9. Menores de edad</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Quinielazo 2026 no está dirigida a menores de 13 años. No recopilamos intencionalmente datos personales de menores de esa edad. Si tienes conocimiento de que un menor ha proporcionado sus datos personales en nuestra Plataforma, te pedimos que nos lo notifiques para proceder a su eliminación.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">10. Cambios a este Aviso</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Podemos actualizar este Aviso de Privacidad periódicamente. La versión vigente siempre estará disponible en esta página con la fecha de última actualización. Te notificaremos por correo electrónico en caso de cambios sustanciales que afecten tus derechos.
          </p>

          <h2 className="font-display text-xl text-foreground mt-10 mb-3">11. Autoridad competente</h2>
          <p className="mb-6 text-muted-foreground leading-relaxed">
            Si consideras que el tratamiento de tus datos personales infringe la LFPDPPP, tienes derecho a acudir al Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) en www.inai.org.mx.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
