import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Star, Users } from 'lucide-react';

// Placeholder data for courses
const featuredCourses = [
  {
    id: '1',
    nombre: 'Desarrollo Web Full-Stack con Next.js y Firebase',
    descripcionCorta: 'Aprende a construir aplicaciones web modernas y escalables desde cero.',
    precio: 99.99,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'web development',
    rating: 4.8,
    students: 1250,
    category: 'Desarrollo Web',
  },
  {
    id: '2',
    nombre: 'Diseño de UI/UX para Aplicaciones Móviles',
    descripcionCorta: 'Domina los principios del diseño de interfaces y experiencia de usuario.',
    precio: 79.50,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'ui ux design',
    rating: 4.9,
    students: 980,
    category: 'Diseño',
  },
  {
    id: '3',
    nombre: 'Marketing Digital Estratégico para Emprendedores',
    descripcionCorta: 'Impulsa tu negocio con estrategias de marketing digital efectivas.',
    precio: 120.00,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'digital marketing',
    rating: 4.7,
    students: 1500,
    category: 'Marketing',
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url('/hero-bg-pattern.svg')", backgroundRepeat: 'repeat' }}></div>
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Transforma tu Futuro con <span className="text-primary">MentorBloom</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto mb-10">
            Descubre cursos online de alta calidad impartidos por expertos y únete a una comunidad de aprendizaje vibrante.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/courses">Explorar Cursos <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">Conviértete en Creator</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">¿Por qué MentorBloom?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Cursos de Expertos</h3>
              <p className="text-foreground/70">Contenido actualizado y relevante impartido por profesionales de la industria.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-accent/10 rounded-full mb-4">
                <Users className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Comunidad Activa</h3>
              <p className="text-foreground/70">Conecta con otros estudiantes y creators, comparte conocimientos y expande tu red.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Aprendizaje Flexible</h3>
              <p className="text-foreground/70">Aprende a tu propio ritmo, desde cualquier lugar y en cualquier dispositivo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section id="featured-courses" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">Cursos Destacados</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-0">
                  <Image
                    src={course.imagenPortada}
                    alt={course.nombre}
                    width={600}
                    height={400}
                    className="aspect-[3/2] w-full object-cover"
                    data-ai-hint={course.dataAiHint}
                  />
                </CardHeader>
                <CardContent className="flex-grow p-6">
                  <p className="text-sm text-primary mb-1 font-medium">{course.category}</p>
                  <CardTitle className="text-xl font-headline mb-2 leading-tight">
                    <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
                      {course.nombre}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-sm text-foreground/70 mb-4">{course.descripcionCorta}</CardDescription>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span>{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students} estudiantes</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 bg-secondary/30 flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">${course.precio.toFixed(2)}</span>
                  <Button asChild variant="default" size="sm">
                    <Link href={`/courses/${course.id}`}>Ver Curso</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/courses">Ver Todos los Cursos <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action - Become a Creator */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6">Comparte tu Conocimiento</h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-primary-foreground/90">
            Conviértete en un creator en MentorBloom y alcanza a miles de estudiantes. Crea, publica y monetiza tus cursos fácilmente.
          </p>
          <Button size="lg" variant="secondary" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup?role=creator">Empezar como Creator</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
