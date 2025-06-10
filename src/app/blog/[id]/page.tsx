import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, UserCircle, MessageSquare, ArrowLeft } from "lucide-react";

// Placeholder data for a single blog post
const blogPost = {
  id: "1",
  title: "5 Consejos para Maximizar tu Aprendizaje Online",
  content: `
    <p>El aprendizaje en línea ha revolucionado la forma en que adquirimos conocimientos y habilidades. Sin embargo, para aprovechar al máximo esta modalidad, es crucial adoptar estrategias efectivas. Aquí te presentamos cinco consejos clave:</p>
    
    <h2 class="text-xl font-semibold mt-6 mb-3 font-headline">1. Establece un Espacio de Estudio Dedicado</h2>
    <p>Tener un lugar específico para estudiar, libre de distracciones, te ayudará a concentrarte y a entrar en "modo aprendizaje" más fácilmente. Asegúrate de que sea cómodo, bien iluminado y con todo lo necesario a mano.</p>
    <figure class="my-4">
      <img src="https://placehold.co/800x450.png" alt="Espacio de estudio organizado" class="rounded-lg shadow-md mx-auto" data-ai-hint="study space">
      <figcaption class="text-center text-sm text-muted-foreground mt-2">Un entorno ordenado fomenta la concentración.</figcaption>
    </figure>

    <h2 class="text-xl font-semibold mt-6 mb-3 font-headline">2. Crea un Horario y Sé Consistente</h2>
    <p>Trata tus cursos online como si fueran clases presenciales. Define horarios fijos para estudiar y cúmplelos. La consistencia es clave para progresar y evitar la procrastinación. Utiliza un calendario o una app de planificación para organizar tu tiempo.</p>

    <h2 class="text-xl font-semibold mt-6 mb-3 font-headline">3. Participa Activamente</h2>
    <p>No te limites a ver videos o leer material. Participa en foros, haz preguntas, completa ejercicios y, si es posible, interactúa con otros estudiantes. El aprendizaje activo mejora la retención y la comprensión.</p>

    <h2 class="text-xl font-semibold mt-6 mb-3 font-headline">4. Toma Descansos Regulares</h2>
    <p>Estudiar durante horas sin parar puede ser contraproducente. Aplica técnicas como Pomodoro (25 minutos de estudio, 5 de descanso) para mantener tu mente fresca y productiva. Levántate, estírate o haz algo diferente durante tus pausas.</p>

    <h2 class="text-xl font-semibold mt-6 mb-3 font-headline">5. Aplica lo Aprendido</h2>
    <p>Busca formas de poner en práctica los conocimientos adquiridos. Realiza proyectos personales, enseña a otros o busca situaciones reales donde puedas aplicar las nuevas habilidades. Esto no solo refuerza el aprendizaje, sino que también te da experiencia valiosa.</p>

    <p class="mt-6">Siguiendo estos consejos, estarás en camino de convertirte en un estudiante online altamente efectivo y alcanzar tus objetivos de aprendizaje. ¡Mucho éxito!</p>
  `,
  imageUrl: "https://placehold.co/1200x675.png",
  dataAiHint: "online education",
  date: "15 de Julio, 2024",
  author: {
    name: "Equipo consciousness-class",
    avatarUrl: "https://placehold.co/80x80.png",
    dataAiHint: "team avatar"
  },
  category: "Productividad",
  tags: ["aprendizaje online", "productividad", "estudio", "consejos"],
  comments: [
    { id: 'c1', user: { name: 'Laura G.', avatar: 'https://placehold.co/40x40.png' }, text: '¡Muy buenos consejos! El de crear un horario me ha ayudado mucho.', date: 'Hace 1 día' },
    { id: 'c2', user: { name: 'Marcos R.', avatar: 'https://placehold.co/40x40.png' }, text: 'Aplicar lo aprendido es fundamental. Gracias por recordarlo.', date: 'Hace 3 horas' },
  ]
};

export default function BlogPostPage({ params }: { params: { id: string } }) {
  // In a real app, fetch post data based on params.id
  // For now, use placeholder `blogPost`

  return (
    <div className="bg-secondary/30">
      <div className="container mx-auto max-w-4xl py-12 px-4 md:px-6">
        <Button variant="outline" asChild className="mb-8">
          <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Blog</Link>
        </Button>

        <article>
          <header className="mb-8">
            <p className="text-primary font-semibold mb-1">{blogPost.category}</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline mb-4">{blogPost.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground space-x-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={blogPost.author.avatarUrl} alt={blogPost.author.name} data-ai-hint={blogPost.author.dataAiHint} />
                  <AvatarFallback>{blogPost.author.name.substring(0,1)}</AvatarFallback>
                </Avatar>
                <span>{blogPost.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>{blogPost.date}</span>
              </div>
            </div>
          </header>

          {blogPost.imageUrl && (
            <Image
              src={blogPost.imageUrl}
              alt={blogPost.title}
              width={1200}
              height={675}
              className="w-full aspect-video object-cover rounded-lg shadow-lg mb-8"
              data-ai-hint={blogPost.dataAiHint}
              priority
            />
          )}

          <div className="prose max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: blogPost.content }} />

          {blogPost.tags && blogPost.tags.length > 0 && (
            <div className="mt-8 pt-4 border-t">
              <span className="font-semibold mr-2">Etiquetas:</span>
              {blogPost.tags.map(tag => (
                <Link key={tag} href={`/blog/tag/${tag.toLowerCase().replace(/\s+/g, '-')}`} passHref>
                  <Button variant="outline" size="sm" className="mr-2 mb-2 text-xs">{tag}</Button>
                </Link>
              ))}
            </div>
          )}
        </article>

        {/* Comments Section */}
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold font-headline mb-6 flex items-center">
            <MessageSquare className="mr-3 h-6 w-6 text-primary" /> Comentarios ({blogPost.comments.length})
          </h2>
          <div className="space-y-6 mb-8">
            {blogPost.comments.map(comment => (
              <Card key={comment.id} className="shadow-sm">
                <CardContent className="p-4 flex gap-3">
                  <Avatar className="h-10 w-10 mt-1">
                    <AvatarImage src={comment.user.avatar} alt={comment.user.name} data-ai-hint="user avatar comment"/>
                    <AvatarFallback>{comment.user.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-0.5">{comment.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Deja un comentario</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <textarea
                  rows={4}
                  placeholder="Escribe tu comentario aquí..."
                  className="w-full p-2 border rounded-md focus:ring-primary focus:border-primary text-sm"
                ></textarea>
                <Button type="submit">Publicar Comentario</Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
