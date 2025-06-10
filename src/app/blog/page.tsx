import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays, UserCircle } from "lucide-react";

const blogPosts = [
  {
    id: "1",
    title: "5 Consejos para Maximizar tu Aprendizaje Online",
    excerpt: "Descubre estrategias efectivas para sacar el máximo provecho de tus cursos en línea y alcanzar tus metas educativas...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "online learning",
    date: "15 de Julio, 2024",
    author: "Equipo consciousness-class",
    category: "Productividad",
  },
  {
    id: "2",
    title: "El Futuro del Trabajo Remoto y las Habilidades Clave",
    excerpt: "Analizamos las tendencias del trabajo remoto y las habilidades más demandadas en el mercado laboral actual...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "remote work skills",
    date: "10 de Julio, 2024",
    author: "Ana Pérez (Experta en HR)",
    category: "Carrera Profesional",
  },
  {
    id: "3",
    title: "Cómo Crear un Curso Online Exitoso: Guía para Creators",
    excerpt: "Pasos esenciales y mejores prácticas para diseñar, desarrollar y lanzar un curso online que impacte a tus estudiantes...",
    imageUrl: "https://placehold.co/600x400.png",
    dataAiHint: "course creation",
    date: "5 de Julio, 2024",
    author: "Carlos López (Creator Destacado)",
    category: "Para Creators",
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Blog de consciousness-class</h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          Artículos, consejos y novedades sobre aprendizaje online, desarrollo profesional y más.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Card key={post.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-0">
              <Link href={`/blog/${post.id}`}>
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  width={600}
                  height={400}
                  className="aspect-[16/10] w-full object-cover"
                  data-ai-hint={post.dataAiHint}
                />
              </Link>
            </CardHeader>
            <CardContent className="flex-grow p-6">
              <p className="text-sm text-primary mb-1 font-medium">{post.category}</p>
              <CardTitle className="text-xl font-headline mb-2 leading-tight">
                <Link href={`/blog/${post.id}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className="text-sm text-foreground/70 mb-4 h-20 overflow-hidden">{post.excerpt}</CardDescription>
              <div className="flex items-center text-xs text-muted-foreground space-x-3">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <UserCircle className="h-3.5 w-3.5" />
                  <span>{post.author}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-secondary/30">
              <Button asChild variant="link" className="p-0 h-auto text-primary hover:underline">
                <Link href={`/blog/${post.id}`}>Leer Más <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Pagination Placeholder */}
      <div className="mt-12 flex justify-center">
        <Button variant="outline" className="mr-2">Anterior</Button>
        <Button variant="default">Siguiente</Button>
      </div>
    </div>
  );
}
