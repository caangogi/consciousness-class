
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookOpen, Settings, DollarSign, Info, Loader2, AlertTriangle, RefreshCw } from "lucide-react"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserProperties, UserRole } from '@/features/user/domain/entities/user.entity';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';

// Placeholder data for stats (actual implementation can be added later)
const placeholderStats = {
  totalUsers: 0, 
  totalCourses: 150, 
  totalRevenue: 125600.75, 
  activeSubscriptions: 850, 
};

const pendingApprovals = [
    { id: 'c4', title: 'Curso de Cocina Tailandesa', creator: 'Chef Rama', type: 'curso' },
    { id: 'u4', name: 'David Lee', email: 'david.lee@example.com', type: 'creator_request'},
];

export default function SuperadminDashboardPage() {
  const { currentUser } = useAuth(); 
  const { toast } = useToast();
  const [recentUsers, setRecentUsers] = useState<UserProperties[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState(placeholderStats);


  const fetchRecentUsers = useCallback(async () => {
    if (!currentUser || !auth.currentUser) {
      setIsLoadingUsers(false);
      setUsersError("Autenticación requerida para cargar usuarios.");
      return;
    }
    setIsLoadingUsers(true);
    setUsersError(null);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      // Request more users to see if creators appear
      const response = await fetch('/api/superadmin/users', { 
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar usuarios recientes.');
      }
      const data = await response.json();
      setRecentUsers(data.users || []);
      // Update totalUsers based on the actual count from the API response if available,
      // or keep it as part of placeholderStats if the API doesn't return total count for all users.
      // For now, if data.users exists, use its length for the "Recent Users" stat.
      // A more accurate total users count would require a separate API or count query.
      setPlatformStats(prev => ({ ...prev, totalUsers: data.users?.length || prev.totalUsers })); 
    } catch (err: any) {
      setUsersError(err.message);
      toast({
        title: 'Error al Cargar Usuarios',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchRecentUsers();
  }, [fetchRecentUsers]);

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'student': return 'outline';
      case 'creator': return 'secondary';
      case 'superadmin': return 'default';
      default: return 'outline';
    }
  };
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
        case 'student': return 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700';
        case 'creator': return 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700';
        case 'superadmin': return 'border-red-400 text-red-100 bg-red-600 hover:bg-red-700';
        default: return 'border-gray-300 text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };


  const renderUserTableContent = () => {
    if (isLoadingUsers) {
      return (
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={`skeleton-user-${i}`}>
              <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (usersError) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={3} className="text-center py-6">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
              <p className="text-destructive text-sm">{usersError}</p>
              <Button onClick={fetchRecentUsers} variant="link" size="sm" className="mt-2 text-primary">
                <RefreshCw className="mr-2 h-3 w-3" /> Reintentar
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }
    
    if (recentUsers.length === 0) {
        return (
             <TableBody><TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow></TableBody>
        );
    }

    return (
      <TableBody>
        {recentUsers.map(user => (
          <TableRow key={user.uid}>
            <TableCell className="font-medium">{user.displayName || `${user.nombre} ${user.apellido}`}</TableCell>
            <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
            <TableCell className="text-center">
              <Badge variant={getRoleBadgeVariant(user.role)} className={cn("capitalize", getRoleBadgeClass(user.role))}>
                {user.role}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };

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
                Desde aquí puedes supervisar y gestionar aspectos clave de la plataforma consciousness-class.
            </p>
        </CardContent>
      </Card>

      {/* Platform Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? <Skeleton className="h-7 w-16"/> : <div className="text-2xl font-bold">{recentUsers.length}</div>}
             <p className="text-xs text-muted-foreground">Mostrando {recentUsers.length} usuarios (Recientes). <span className="italic">Total real puede ser mayor.</span></p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Totales (Ejemplo)</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalCourses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cursos disponibles y en borrador.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales (Ejemplo)</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} €</div>
             <p className="text-xs text-muted-foreground">Ingresos generados por la plataforma.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones (Ejemplo)</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.activeSubscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Suscripciones activas actualmente.</p>
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
                <CardTitle className="text-xl font-headline">Usuarios Recientes</CardTitle>
                <CardDescription>Últimos usuarios registrados en la plataforma (ordenados por fecha de creación).</CardDescription>
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
                    {renderUserTableContent()}
                </Table>
                <Button variant="link" asChild className="mt-4 p-0 h-auto text-primary hover:underline">
                    <Link href="#" className="opacity-50 pointer-events-none">Ver todos (Próximamente)</Link>
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
