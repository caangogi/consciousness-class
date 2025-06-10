import { CourseCard, type Course } from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';

// Placeholder data for courses
const courses: Course[] = [
  {
    id: '1',
    nombre: 'Desarrollo Web Avanzado con Next.js y GraphQL',
    descripcionCorta: 'Construye APIs robustas y aplicaciones full-stack interactivas.',
    precio: 149.99,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'web development advanced',
    creadorNombre: 'Ana Pérez',
    duracionEstimada: '25 horas',
    rating: 4.9,
    numEstudiantes: 850,
    categoria: 'Desarrollo Web',
  },
  {
    id: '2',
    nombre: 'Introducción al Machine Learning con Python',
    descripcionCorta: 'Aprende los fundamentos del Machine Learning y aplica modelos prácticos.',
    precio: 119.00,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'machine learning python',
    creadorNombre: 'Carlos López',
    duracionEstimada: '18 horas',
    rating: 4.7,
    numEstudiantes: 1200,
    categoria: 'Data Science',
  },
  {
    id: '3',
    nombre: 'Fotografía Profesional: De Cero a Héroe',
    descripcionCorta: 'Domina tu cámara y aprende técnicas de composición y edición.',
    precio: 89.50,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'professional photography',
    creadorNombre: 'Laura Gómez',
    duracionEstimada: '15 horas',
    rating: 4.8,
    numEstudiantes: 950,
    categoria: 'Fotografía',
  },
  {
    id: '4',
    nombre: 'Marketing de Contenidos para Redes Sociales',
    descripcionCorta: 'Crea contenido atractivo que convierta seguidores en clientes.',
    precio: 99.00,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'content marketing social',
    creadorNombre: 'Juan Rodríguez',
    duracionEstimada: '12 horas',
    rating: 4.6,
    numEstudiantes: 1100,
    categoria: 'Marketing',
  },
   {
    id: '5',
    nombre: 'Finanzas Personales e Inversión Inteligente',
    descripcionCorta: 'Gestiona tu dinero y aprende a invertir para tu futuro.',
    precio: 75.00,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'personal finance investment',
    creadorNombre: 'Sofía Torres',
    duracionEstimada: '10 horas',
    rating: 4.9,
    numEstudiantes: 1500,
    categoria: 'Finanzas',
  },
  {
    id: '6',
    nombre: 'Desarrollo de Videojuegos con Unity',
    descripcionCorta: 'Crea tus propios videojuegos 2D y 3D desde cero.',
    precio: 199.99,
    imagenPortada: 'https://placehold.co/600x400.png',
    dataAiHint: 'game development unity',
    creadorNombre: 'Miguel Ángel',
    duracionEstimada: '40 horas',
    rating: 4.8,
    numEstudiantes: 700,
    categoria: 'Desarrollo de Videojuegos',
  },
];

export default function CoursesPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Explora Nuestros Cursos</h1>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          Encuentra el curso perfecto para expandir tus habilidades y alcanzar tus metas profesionales.
        </p>
      </header>

      {/* Filters Section */}
      <div className="mb-8 p-6 bg-card rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <Input
              type="search"
              placeholder="Buscar por nombre o palabra clave..."
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              <SelectItem value="web-development">Desarrollo Web</SelectItem>
              <SelectItem value="data-science">Data Science</SelectItem>
              <SelectItem value="design">Diseño</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="photography">Fotografía</SelectItem>
              <SelectItem value="finance">Finanzas</SelectItem>
              <SelectItem value="game-dev">Desarrollo de Videojuegos</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularidad</SelectItem>
              <SelectItem value="newest">Más Recientes</SelectItem>
              <SelectItem value="rating">Mejor Valorados</SelectItem>
              <SelectItem value="price-asc">Precio: Bajo a Alto</SelectItem>
              <SelectItem value="price-desc">Precio: Alto a Bajo</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="w-full lg:w-auto">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Más Filtros
          </Button>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No se encontraron cursos</h3>
          <p className="text-muted-foreground">Intenta ajustar tus filtros o revisa más tarde.</p>
        </div>
      )}

      {/* Pagination (Placeholder) */}
      <div className="mt-12 flex justify-center">
        <Button variant="outline" className="mr-2">Anterior</Button>
        <Button variant="default">Siguiente</Button>
      </div>
    </div>
  );
}
