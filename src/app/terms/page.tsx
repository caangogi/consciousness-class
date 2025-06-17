
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Términos de Servicio</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-foreground/80">
          <p className="text-sm text-muted-foreground mb-6 text-center">Última actualización: 28 de Julio, 2024</p>
          
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Bienvenido a Consciousness Class ("Plataforma", "nosotros", "nuestro"). Al acceder o utilizar nuestra Plataforma,
            usted ("Usuario", "usted") acepta estar sujeto a estos Términos de Servicio ("Términos") y a nuestra
            Política de Privacidad. Si no está de acuerdo con alguna parte de los términos, no podrá acceder a la Plataforma.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            Consciousness Class es una plataforma online que permite a los usuarios ("Creators") crear y vender cursos y membresías
            ("Contenido") a otros usuarios ("Students"). También ofrecemos un sistema de referidos.
          </p>

          <h2>3. Cuentas de Usuario</h2>
          <p>
            Para acceder a ciertas funcionalidades, deberá registrarse y crear una cuenta. Es responsable de mantener la
            confidencialidad de su contraseña y es completamente responsable de todas las actividades que ocurran bajo su cuenta.
            Debe notificarnos inmediatamente cualquier uso no autorizado de su cuenta o cualquier otra violación de seguridad.
          </p>
          <p>Existen tres tipos de roles: Superadmin, Creator y Student, cada uno con diferentes niveles de acceso y permisos.</p>

          <h2>4. Contenido del Creator</h2>
          <p>
            Los Creators son propietarios de su Contenido. Al publicar Contenido en Consciousness Class, otorgan a Consciousness Class una licencia
            mundial, no exclusiva, libre de regalías para usar, reproducir, distribuir, preparar trabajos derivados, mostrar
            y ejecutar el Contenido en relación con la prestación de los servicios de la Plataforma.
          </p>
          <p>Los Creators son responsables de asegurar que su Contenido no infringe derechos de autor de terceros ni viola ninguna ley.</p>

          <h2>5. Pagos y Comisiones</h2>
          <p>
            Los pagos por Contenido se procesan a través de Stripe. Consciousness Class retendrá una comisión sobre cada venta, cuyo porcentaje
            será especificado en la configuración de la plataforma o en el acuerdo con el Creator.
          </p>
          <p>Los detalles sobre suscripciones, pagos únicos y reembolsos se gestionarán según las políticas de Stripe y las establecidas por Consciousness Class.</p>
          
          <h2>6. Sistema de Referidos</h2>
          <p>
            Los usuarios pueden participar en nuestro sistema de referidos. Las recompensas y condiciones del sistema de referidos
            serán especificadas en la plataforma y podrán ser modificadas por Consciousness Class o por los Creators para sus cursos específicos.
          </p>

          <h2>7. Conducta del Usuario</h2>
          <p>
            Usted se compromete a no utilizar la Plataforma para ningún propósito ilegal o prohibido por estos Términos. No debe:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Publicar material que sea ilegal, obsceno, difamatorio, amenazante, o que infrinja derechos de propiedad intelectual.</li>
            <li>Acosar, abusar o dañar a otra persona.</li>
            <li>Intentar obtener acceso no autorizado a la Plataforma o a sistemas relacionados.</li>
          </ul>

          <h2>8. Terminación</h2>
          <p>
            Nos reservamos el derecho de suspender o terminar su acceso a la Plataforma en cualquier momento, sin previo aviso,
            por cualquier violación de estos Términos.
          </p>
          
          <h2>9. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley aplicable, Consciousness Class no será responsable de ningún daño indirecto, incidental,
            especial, consecuente o punitivo, ni de ninguna pérdida de beneficios o ingresos, ya sea incurrida directa o
            indirectamente, o cualquier pérdida de datos, uso, fondo de comercio u otras pérdidas intangibles, resultantes de (i) su
            acceso o uso o incapacidad para acceder o usar la plataforma; (ii) cualquier conducta o contenido de cualquier tercero en
            la plataforma.
          </p>

          <h2>10. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Le notificaremos cualquier cambio publicando
            los nuevos Términos en esta página. Se recomienda revisar estos Términos periódicamente.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en <a href="mailto:legal@consciousness-class.com" className="text-primary hover:underline">legal@consciousness-class.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    