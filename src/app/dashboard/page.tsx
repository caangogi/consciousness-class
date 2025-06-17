
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, ArrowRight, BookOpen, BarChartBig, Users, Settings, Gift } from "lucide-react"; 


const userRole = 'student'; 

const roleSpecificLinks = {
  student: [
    { title: "Mis Cursos", description: "Accede a tus cursos inscritos y continúa tu aprendizaje.", href: "/dashboard/student", icon: BookOpen },
    { title: "Mi Perfil", description: "Actualiza tu información personal y preferencias.", href: "/dashboard/student", icon: Users },
  ],
  creator: [
    { title: "Gestionar Cursos", description: "Crea, edita y publica tus cursos.", href: "/dashboard/creator/courses", icon: BookOpen },
    { title: "Estadísticas", description: "Analiza el rendimiento de tus cursos e ingresos.", href: "/dashboard/creator/stats", icon: BarChartBig },
  ],
  superadmin: [
    { title: "Gestión de Usuarios", description: "Administra todos los usuarios de la plataforma.", href: "/dashboard/superadmin/user-management", icon: Users },
    { title: "Configuración Global", description: "Ajusta los parámetros generales de Consciousness Class.", href: "/dashboard/superadmin/settings", icon: Settings },
  ],
};

export default function DashboardPage() {
  const links = roleSpecificLinks[userRole] || [];

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Bienvenido a tu Dashboard</CardTitle>
          <CardDescription>Aquí puedes gestionar tu actividad en Consciousness Class.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Desde esta página central, puedes navegar a las diferentes secciones de tu panel de control.
            Utiliza el menú lateral para acceder a todas las funcionalidades disponibles para tu rol.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div> 
            <p className="text-xs text-muted-foreground">Cursos en los que estás inscrito o gestionando.</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div> 
            <p className="text-xs text-muted-foreground">Nuevas lecciones o comentarios esta semana.</p>
          </CardContent>
        </Card>

        {userRole === 'student' && (
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recompensas de Referidos</CardTitle>
              <Gift className="h-5 w-5 text-muted-foreground" /> 
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$25.00</div> 
              <p className="text-xs text-muted-foreground">Crédito disponible por referidos.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-headline font-semibold mb-4">Accesos Rápidos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {links.map(link => (
            <Card key={link.title} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <link.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="font-headline">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                <Button variant="outline" asChild size="sm">
                  <Link href={link.href}>Ir a {link.title} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

    