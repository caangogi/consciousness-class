
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookOpen, Settings, Ticket, ShieldCheck, Info } from "lucide-react"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Placeholder data
const platformStats = {
  totalUsers: 10520,
  totalCourses: 150,
  totalRevenue: 125600.75,
  activeSubscriptions: 850,
};

const recentUsers = [
  { id: 'u1', name: 'Alice Johnson', email: 'alice@example.com', role: 'student' as const, dateJoined: '2024-07-15' },
  { id: 'u2', name: 'Bob Williams', email: 'bob@example.com', role: 'creator' as const, dateJoined: '2024-07-14' },
  { id: 'u3', name: 'Carol Davis', email: 'carol@example.com', role: 'student' as const, dateJoined: '2024-07-14' },
];

const pendingApprovals = [
    { id: 'c4', title: 'Curso de Cocina Tailandesa', creator: 'Chef Rama', type: 'curso' },
    { id: 'u4', name: 'David Lee', email: 'david.lee@example.com', type: 'creator_request'},
];

// Placeholder DollarSign icon if not globally available
const DollarSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" x2="12" y1="1" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);


export default function SuperadminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Panel de Superadministrador</h1>
      
      <Card className="shadow-md">
        <CardHeader>
            <div className="flex items-center gap-2">
                <Info className="h-6 w-6 text-primary"/>
                <CardTitle className="text-xl font-headline">Bienvenido, Superadministrador</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Esta sección está en desarrollo. Próximamente podrás gestionar usuarios, cursos, y ver estadísticas detalladas de la plataforma.
                Por ahora, las estadísticas mostradas son datos de ejemplo.
            </p>
        </CardContent>
      </Card>

      {/* Platform Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales (Ejemplo)</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Totales (Ejemplo)</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalCourses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (Ejemplo)</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</div>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones (Ejemplo)</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.activeSubscriptions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Links Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-xl font-headline">Gestión de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Administra roles, permisos y datos de usuarios.</CardDescription>
            <Button variant="outline" disabled>Ir (Próximamente)</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-xl font-headline">Gestión de Cursos</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Revisa, aprueba y gestiona todos los cursos de la plataforma.</CardDescription>
            <Button variant="outline" disabled>Ir (Próximamente)</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <Settings className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-xl font-headline">Configuración Global</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Ajusta comisiones, referidos y otros parámetros de la plataforma.</CardDescription>
            <Button variant="outline" disabled>Ir (Próximamente)</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Pending Approvals */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Usuarios Recientes (Ejemplo)</CardTitle>
                <CardDescription>Últimos usuarios registrados en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead className="hidden sm:table-cell">Email</TableHead>
                            <TableHead className="text-center">Rol</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={user.role === 'creator' ? 'secondary' : 'outline' } className={user.role === 'creator' ? 'bg-blue-100 text-blue-700' : ''}>{user.role}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button variant="link" asChild className="mt-4 p-0 h-auto text-primary hover:underline">
                    <Link href="/dashboard/superadmin/user-management" className="pointer-events-none opacity-50">Ver todos (Próximamente)</Link>
                </Button>
            </CardContent>
        </Card>
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Pendientes de Aprobación (Ejemplo)</CardTitle>
                <CardDescription>Nuevos cursos o solicitudes de creator para revisar.</CardDescription>
            </CardHeader>
            <CardContent>
                 {pendingApprovals.length > 0 ? (
                    <ul className="space-y-3">
                    {pendingApprovals.map(item => (
                        <li key={item.id} className="p-3 border rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.type === 'curso' ? item.title : item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.type === 'curso' ? `Por: ${item.creator}` : item.email}</p>
                        </div>
                        <Button size="sm" variant="outline" disabled>Revisar</Button>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">No hay elementos pendientes de aprobación (Ejemplo).</p>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
