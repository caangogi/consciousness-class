import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl md:text-4xl font-bold font-headline">Política de Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none text-foreground/80">
          <p className="text-sm text-muted-foreground mb-6 text-center">Última actualización: 28 de Julio, 2024</p>

          <h2>1. Introducción</h2>
          <p>
            consciousness-class ("nosotros", "nuestro", "Plataforma") se compromete a proteger su privacidad. Esta Política de
            Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos su información cuando visita
            nuestra plataforma. Lea esta política de privacidad detenidamente. Si no está de acuerdo con los términos de
            esta política de privacidad, no acceda a la plataforma.
          </p>

          <h2>2. Recopilación de su Información</h2>
          <p>Podemos recopilar información sobre usted de varias maneras. La información que podemos recopilar en la Plataforma incluye:</p>
          <h3>Datos Personales</h3>
          <p>
            Información de identificación personal, como su nombre, dirección de correo electrónico, y otra información
            que nos proporcione voluntariamente cuando se registra en la Plataforma o cuando elige participar en diversas
            actividades relacionadas con la Plataforma, como chats en línea y tableros de mensajes.
          </p>
          <h3>Datos Derivados</h3>
          <p>
            Información que nuestros servidores recopilan automáticamente cuando accede a la Plataforma, como su dirección IP,
            su tipo de navegador, su sistema operativo, sus tiempos de acceso y las páginas que ha visto directamente
            antes y después de acceder a la Plataforma.
          </p>
          <h3>Datos Financieros</h3>
          <p>
            Información financiera, como datos relacionados con su método de pago (por ejemplo, número de tarjeta de crédito
            válido, marca de la tarjeta, fecha de vencimiento) que podemos recopilar cuando compra, ordena, devuelve,
            intercambia o solicita información sobre nuestros servicios desde la Plataforma. Almacenamos muy poca, si
            alguna, información financiera que recopilamos. De lo contrario, toda la información financiera es almacenada
            por nuestro procesador de pagos (Stripe) y le recomendamos que revise su política de privacidad y se comunique
            directamente con ellos para obtener respuestas a sus preguntas.
          </p>
          <h3>Datos de Firebase y Google Analytics</h3>
          <p>
            Utilizamos Firebase para la autenticación, base de datos (Firestore) y almacenamiento (Cloud Storage).
            También podemos usar Firebase Analytics o Google Analytics para recopilar información sobre el uso de la
            Plataforma.
          </p>

          <h2>3. Uso de su Información</h2>
          <p>Tener información precisa sobre usted nos permite brindarle una experiencia fluida, eficiente y personalizada. Específicamente, podemos usar la información recopilada sobre usted a través de la Plataforma para:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Crear y administrar su cuenta.</li>
            <li>Procesar sus pagos y reembolsos.</li>
            <li>Enviarle un correo electrónico con respecto a su cuenta o pedido.</li>
            <li>Permitir la comunicación entre usuarios.</li>
            <li>Generar un perfil personal sobre usted para que las futuras visitas a la Plataforma sean más personalizadas.</li>
            <li>Aumentar la eficiencia y el funcionamiento de la Plataforma.</li>
            <li>Monitorear y analizar el uso y las tendencias para mejorar su experiencia con la Plataforma.</li>
            <li>Notificarle las actualizaciones de la Plataforma.</li>
            <li>Ofrecerle nuevos productos, servicios y/o recomendaciones.</li>
          </ul>

          <h2>4. Divulgación de su Información</h2>
          <p>Podemos compartir información que hemos recopilado sobre usted en ciertas situaciones. Su información puede ser divulgada de la siguiente manera:</p>
          <h3>Por Ley o para Proteger Derechos</h3>
          <p>
            Si creemos que la divulgación de información sobre usted es necesaria para responder a un proceso legal, para
            investigar o remediar posibles violaciones de nuestras políticas, o para proteger los derechos, la propiedad y
            la seguridad de otros, podemos compartir su información según lo permita o exija cualquier ley, regla o
            regulación aplicable.
          </p>
          <h3>Proveedores de Servicios de Terceros</h3>
          <p>
            Podemos compartir su información con terceros que realizan servicios para nosotros o en nuestro nombre, incluido
            el procesamiento de pagos (Stripe), análisis de datos (Google Analytics, Firebase Analytics), entrega de correo
            electrónico, servicios de alojamiento, servicio al cliente y asistencia de marketing.
          </p>
          <h3>Interacciones con Otros Usuarios</h3>
          <p>
            Si interactúa con otros usuarios de la Plataforma, esos usuarios pueden ver su nombre, foto de perfil y
            descripciones de su actividad, incluido el envío de invitaciones a otros usuarios, chatear con otros usuarios,
            dar me gusta a las publicaciones, seguir blogs.
          </p>

          <h2>5. Seguridad de su Información</h2>
          <p>
            Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger su información
            personal. Si bien hemos tomado medidas razonables para proteger la información personal que nos proporciona,
            tenga en cuenta que a pesar de nuestros esfuerzos, ninguna medida de seguridad es perfecta o impenetrable, y
            ningún método de transmisión de datos puede garantizarse contra cualquier interceptación u otro tipo de uso
            indebido.
          </p>

          <h2>6. Política para Niños</h2>
          <p>
            No solicitamos conscientemente información ni comercializamos a niños menores de 13 años. Si se da cuenta de
            cualquier dato que hayamos recopilado de niños menores de 13 años, contáctenos utilizando la información de
            contacto proporcionada a continuación.
          </p>

          <h2>7. Opciones Respecto a su Información</h2>
          <h3>Información de la Cuenta</h3>
          <p>
            Puede revisar o cambiar la información de su cuenta en cualquier momento o cancelar su cuenta iniciando sesión
            en la configuración de su cuenta y actualizando su cuenta o contactándonos utilizando la información de
            contacto proporcionada a continuación.
          </p>
          <h3>Correos Electrónicos y Comunicaciones</h3>
          <p>
            Si ya no desea recibir correspondencia, correos electrónicos u otras comunicaciones de nosotros, puede optar
            por no participar:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Anotando sus preferencias en el momento en que registra su cuenta en la Plataforma.</li>
            <li>Iniciando sesión en la configuración de su cuenta y actualizando sus preferencias.</li>
            <li>Contactándonos utilizando la información de contacto proporcionada a continuación.</li>
          </ul>

          <h2>8. Contacto</h2>
          <p>
            Si tiene preguntas o comentarios sobre esta Política de Privacidad, contáctenos en:
            <br />
            consciousness-class
            <br />
            <a href="mailto:privacy@consciousness-class.com" className="text-primary hover:underline">privacy@consciousness-class.com</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
