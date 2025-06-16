
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Edit3, BarChart2, Settings, MessageSquare, Users, Eye, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen as BookOpenIcon, Star as StarIcon, DollarSign as DollarSignIcon } from "lucide-react"; // Renamed to avoid conflict


// Placeholder data
const creatorCourses = [
  { id: 'c1', title: 'Desarrollo Web Avanzado', students: 850, earnings: 12750.00, status: 'publicado' as const },
  { id: 'c2', title: 'Fotografía Esencial', students: 320, earnings: 2400.00, status: 'borrador' as const },
  { id: 'c3', title: 'Marketing para Principiantes', students: 1200, earnings: 9000.00, status: 'publicado' as const },
];

const stats = {
  totalStudents: 2370,
  totalEarnings: 24150.00,
  avgRating: 4.8,
  activeCourses: 2,
};

export default function CreatorDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold font-headline">Panel de Creator</h1>
        <Button asChild>
          <Link href="/dashboard/creator/courses/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo Curso
          </Link>
        </Button>
      </div>

      {/* Quick Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Estadísticas próximamente.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Estadísticas próximamente.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpenIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">Cursos publicados (próximamente).</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valoración Promedio</CardTitle>
            <StarIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Estadísticas próximamente.</p>
          </CardContent>
        </Card>
      </div>
      
      {/* My Courses Table Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-headline">Mis Cursos</CardTitle>
              <CardDescription>Gestiona tus cursos creados. El listado real se muestra en "Gestionar Cursos".</CardDescription>
            </div>
             <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/creator/courses">Gestionar Cursos</Link>
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título del Curso (Ejemplo)</TableHead>
                <TableHead className="text-center hidden md:table-cell">Estudiantes</TableHead>
                <TableHead className="text-right hidden md:table-cell">Ingresos</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creatorCourses.slice(0, 3).map((course) => ( 
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">{course.students}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{course.earnings.toFixed(2)} €</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={course.status === 'publicado' ? 'default' : 'secondary'}
                           className={course.status === 'publicado' ? 'bg-green-500/20 text-green-700 border-green-500/50' : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50'}>
                      {course.status === 'publicado' ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="Editar (Ir a Gestionar Cursos)">
                      <Link href={`/dashboard/creator/courses/edit/${course.id}`}><Edit3 className="h-4 w-4" /></Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild title="Ver (Ir a página pública)">
                      <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {creatorCourses.length === 0 && <p className="text-muted-foreground mt-4 text-center">Aún no has creado ningún curso.</p>}
           <div className="mt-6 p-4 bg-secondary/50 rounded-md text-sm text-secondary-foreground flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 mt-0.5"/>
                <div>
                    <p className="font-medium">Esta es una vista de ejemplo.</p>
                    <p>Para ver y gestionar todos tus cursos, dirígete a la sección <Link href="/dashboard/creator/courses" className="underline hover:text-primary">Gestionar Cursos</Link>.</p>
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Other Actions Section */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-headline">Configuración de Referidos</CardTitle>
            </div>
            <CardDescription>Define las recompensas para quienes refieran tus cursos.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Esta funcionalidad estará disponible próximamente. Podrás configurar comisiones y condiciones para tu programa de referidos.</p>
            <Button variant="outline" disabled>Configurar (Próximamente)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-headline">Comentarios y Preguntas</CardTitle>
            </div>
            <CardDescription>Revisa y responde a los comentarios de tus estudiantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Próximamente podrás gestionar aquí todas las interacciones de tus estudiantes.</p>
            <Button variant="outline" disabled>Ver Comentarios (Próximamente)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
