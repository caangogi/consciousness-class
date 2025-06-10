import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Users, Clock, CheckCircle, PlayCircle, FileText, Download, MessageSquare, Edit3 } from 'lucide-react';

// Placeholder data for a single course
const course = {
  id: '1',
  nombre: 'Desarrollo Web Avanzado con Next.js y GraphQL',
  descripcionCorta: 'Construye APIs robustas y aplicaciones full-stack interactivas.',
  descripcionLarga: `
    <p>Sumérgete en el mundo del desarrollo web moderno con este curso completo. Aprenderás a construir aplicaciones full-stack de alto rendimiento utilizando Next.js para el frontend y backend, y GraphQL para una gestión de datos eficiente y flexible. Cubriremos temas desde la configuración inicial, enrutamiento avanzado, renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG), hasta la autenticación, gestión de estado, y despliegue en producción.</p>
    <h3 class="text-lg font-semibold mt-4 mb-2">Lo que aprenderás:</h3>
    <ul class="list-disc list-inside space-y-1">
      <li>Configurar y desarrollar con Next.js y TypeScript.</li>
      <li>Crear esquemas y resolvers de GraphQL.</li>
      <li>Integrar Apollo Client/Server.</li>
      <li>Implementar autenticación segura (JWT/OAuth).</li>
      <li>Optimizar el rendimiento de tu aplicación.</li>
      <li>Desplegar en plataformas como Vercel o Firebase Hosting.</li>
    </ul>
    <h3 class="text-lg font-semibold mt-4 mb-2">Requisitos:</h3>
    <ul class="list-disc list-inside space-y-1">
      <li>Conocimientos básicos de HTML, CSS y JavaScript (ES6+).</li>
      <li>Experiencia previa con React (recomendado).</li>
      <li>Comprensión de conceptos de APIs (REST o GraphQL básico).</li>
    </ul>
  `,
  precio: 149.99,
  tipoAcceso: 'unico' as const,
  duracionEstimada: '25 horas de video',
  imagenPortada: 'https://placehold.co/1200x675.png',
  dataAiHint: 'web development course',
  estado: 'publicado' as const,
  creador: {
    id: 'creator1',
    nombre: 'Ana Pérez',
    avatarUrl: 'https://placehold.co/80x80.png',
    bio: 'Ingeniera de Software con 10+ años de experiencia en desarrollo web y móvil. Apasionada por enseñar tecnologías de vanguardia.',
  },
  rating: 4.9,
  numEstudiantes: 850,
  numResenas: 150,
  fechaActualizacion: '2024-07-15',
  modulos: [
    {
      id: 'm1',
      nombre: 'Introducción a Next.js y Configuración del Entorno',
      descripcion: 'Primeros pasos con Next.js, estructura del proyecto y herramientas.',
      orden: 1,
      lecciones: [
        { id: 'l1a', nombre: '¿Qué es Next.js y por qué usarlo?', formato: 'video' as const, duracion: '10 min', esVistaPrevia: true },
        { id: 'l1b', nombre: 'Instalación y configuración inicial', formato: 'video' as const, duracion: '15 min', esVistaPrevia: false },
        { id: 'l1c', nombre: 'Estructura de un proyecto Next.js', formato: 'pdf' as const, duracion: 'N/A', esVistaPrevia: false },
      ],
    },
    {
      id: 'm2',
      nombre: 'GraphQL: Fundamentos y Esquemas',
      descripcion: 'Conceptos clave de GraphQL, tipos, queries, mutations y subscriptions.',
      orden: 2,
      lecciones: [
        { id: 'l2a', nombre: 'Introducción a GraphQL', formato: 'video' as const, duracion: '12 min', esVistaPrevia: true },
        { id: 'l2b', nombre: 'Definición de esquemas y tipos', formato: 'video' as const, duracion: '20 min', esVistaPrevia: false },
        { id: 'l2c', nombre: 'Queries y Mutations', formato: 'video' as const, duracion: '18 min', esVistaPrevia: false },
      ],
    },
    {
      id: 'm3',
      nombre: 'Integración Frontend y Backend',
      descripcion: 'Conectando Next.js con tu API GraphQL usando Apollo Client.',
      orden: 3,
      lecciones: [
        { id: 'l3a', nombre: 'Configurando Apollo Client en Next.js', formato: 'video' as const, duracion: '25 min', esVistaPrevia: false },
        { id: 'l3b', nombre: 'Realizando queries y mostrando datos', formato: 'video' as const, duracion: '30 min', esVistaPrevia: false },
        { id: 'l3c', nombre: 'Manejo de estado local y cache con Apollo', formato: 'video' as const, duracion: '22 min', esVistaPrevia: false },
      ],
    },
  ],
  materialesAdicionales: [
    { nombre: 'Código fuente completo del proyecto final', url: '#' },
    { nombre: 'Guía de referencia rápida de Next.js y GraphQL', url: '#' },
  ],
  comentarios: [
    { id: 'c1', usuario: { nombre: 'Carlos S.', avatarUrl: 'https://placehold.co/40x40.png' }, texto: '¡Excelente curso! Muy bien explicado y con ejemplos prácticos.', rating: 5, fecha: '2024-07-01' },
    { id: 'c2', usuario: { nombre: 'Laura M.', avatarUrl: 'https://placehold.co/40x40.png' }, texto: 'Me ayudó mucho a entender GraphQL. Lo recomiendo.', rating: 5, fecha: '2024-06-28' },
  ]
};

// TODO: Replace with actual user enrollment status
const isEnrolled = false;

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  // In a real app, fetch course data based on params.id
  // For now, we use the placeholder `course` object.
  // You might want to add a check if the course exists or show a 404 page.

  return (
    <div className="bg-secondary/30">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Badge variant="secondary" className="mb-2 bg-accent text-accent-foreground">{course.modulos.length} Módulos</Badge>
            <h1 className="text-3xl md:text-4xl font-bold font-headline mb-3">{course.nombre}</h1>
            <p className="text-lg text-primary-foreground/90 mb-4">{course.descripcionCorta}</p>
            <div className="flex items-center space-x-4 mb-6 text-sm">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2 border-2 border-accent">
                  <AvatarImage src={course.creador.avatarUrl} alt={course.creador.nombre} data-ai-hint="instructor avatar" />
                  <AvatarFallback>{course.creador.nombre.substring(0,2)}</AvatarFallback>
                </Avatar>
                <span>Creado por <Link href={`/creators/${course.creador.id}`} className="font-semibold hover:underline">{course.creador.nombre}</Link></span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-accent fill-accent" />
                <span>{course.rating} ({course.numResenas} reseñas)</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.numEstudiantes} estudiantes</div>
                <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.duracionEstimada}</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Última actualización: {new Date(course.fechaActualizacion).toLocaleDateString()}</div>
            </div>
          </div>
          <Card className="overflow-hidden shadow-2xl">
            <Image
              src={course.imagenPortada}
              alt={`Portada del curso ${course.nombre}`}
              width={1200}
              height={675}
              className="w-full aspect-video object-cover"
              data-ai-hint={course.dataAiHint}
              priority
            />
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-primary mb-4">${course.precio.toFixed(2)}</p>
              {isEnrolled ? (
                 <Button size="lg" className="w-full" asChild>
                    <Link href={`/learn/${course.id}/${course.modulos[0].lecciones[0].id}`}>Ir al Curso</Link>
                  </Button>
              ) : (
                <Button size="lg" className="w-full">
                  Comprar Curso
                </Button>
              )}
              <p className="text-xs text-muted-foreground mt-3 text-center">Acceso de por vida. Certificado de finalización.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Course Details & Curriculum */}
          <div className="lg:col-span-2">
            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Descripción del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: course.descripcionLarga }} />
              </CardContent>
            </Card>

            <Card className="mb-8 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Contenido del Curso</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {course.modulos.map((modulo) => (
                    <AccordionItem value={`module-${modulo.id}`} key={modulo.id}>
                      <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex justify-between w-full items-center pr-2">
                           <span>{modulo.orden}. {modulo.nombre}</span>
                           <span className="text-sm text-muted-foreground font-normal">{modulo.lecciones.length} lecciones</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 pt-2">
                          {modulo.lecciones.map((leccion) => (
                            <li key={leccion.id} className="flex justify-between items-center p-3 rounded-md hover:bg-secondary/50 transition-colors">
                              <div className="flex items-center">
                                {leccion.formato === 'video' ? <PlayCircle className="h-5 w-5 mr-3 text-primary" /> : <FileText className="h-5 w-5 mr-3 text-primary" />}
                                <span className="text-foreground/90">{leccion.nombre}</span>
                                {leccion.esVistaPrevia && <Badge variant="outline" className="ml-2 border-accent text-accent">Vista Previa</Badge>}
                              </div>
                              <span className="text-sm text-muted-foreground">{leccion.duracion}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
            
            {/* Reviews Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Valoraciones y Reseñas</CardTitle>
                <div className="flex items-center mt-2">
                  <Star className="h-6 w-6 text-accent fill-accent mr-1" />
                  <span className="text-2xl font-bold mr-1">{course.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({course.numResenas} reseñas)</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="mb-6">
                  <Edit3 className="mr-2 h-4 w-4" /> Escribir una reseña
                </Button>
                <div className="space-y-6">
                  {course.comentarios.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={comment.usuario.avatarUrl} alt={comment.usuario.nombre} data-ai-hint="user avatar"/>
                        <AvatarFallback>{comment.usuario.nombre.substring(0,1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{comment.usuario.nombre}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < comment.rating ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{comment.fecha}</p>
                        <p className="text-foreground/80">{comment.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-6 text-primary">Ver todas las reseñas</Button>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Creator & Materials */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-headline">Sobre el Creator</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-primary">
                  <AvatarImage src={course.creador.avatarUrl} alt={course.creador.nombre} data-ai-hint="instructor portrait"/>
                  <AvatarFallback>{course.creador.nombre.substring(0,2)}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-primary">{course.creador.nombre}</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">{course.creador.bio}</p>
                <Button variant="outline" asChild>
                  <Link href={`/creators/${course.creador.id}`}>Ver Perfil del Creator</Link>
                </Button>
              </CardContent>
            </Card>

            {course.materialesAdicionales && course.materialesAdicionales.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-headline">Materiales Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.materialesAdicionales.map((material, index) => (
                      <li key={index}>
                        <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline flex items-center">
                          <Link href={material.url} download>
                            <Download className="h-4 w-4 mr-2" /> {material.nombre}
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
