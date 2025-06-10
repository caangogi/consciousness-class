
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Gift,
  BarChart2,
  DollarSign,
  Edit3,
  UserCircle,
  LogOut,
  Ticket,
  ShieldCheck,
  Palette,
  MessageSquare,
  Menu as MenuIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('student' | 'creator' | 'superadmin')[];
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, roles: ['student', 'creator', 'superadmin'] },
  // Student specific
  { href: '/dashboard/student', label: 'Mis Cursos', icon: BookOpen, roles: ['student'] }, // Adjusted
  { href: '/dashboard/student', label: 'Mi Perfil', icon: UserCircle, roles: ['student'] }, // Adjusted
  { href: '/dashboard/student', label: 'Mis Referidos', icon: Gift, roles: ['student'] }, // Adjusted
  { href: '/dashboard/student', label: 'Certificados', icon: AwardIcon, roles: ['student'] }, // Adjusted
  // Creator specific
  { href: '/dashboard/creator', label: 'Resumen Creator', icon: LayoutDashboard, roles: ['creator'] },
  { href: '/dashboard/creator/courses', label: 'Gestionar Cursos', icon: Edit3, roles: ['creator'] },
  { href: '/dashboard/creator/lessons', label: 'Gestionar Lecciones', icon: Palette, roles: ['creator'] },
  { href: '/dashboard/creator/stats', label: 'Estadísticas', icon: BarChart2, roles: ['creator'] },
  { href: '/dashboard/creator/referral-config', label: 'Config. Referidos', icon: Settings, roles: ['creator'] },
  { href: '/dashboard/creator/earnings', label: 'Ingresos', icon: DollarSign, roles: ['creator'] },
  { href: '/dashboard/creator/comments', label: 'Comentarios', icon: MessageSquare, roles: ['creator'] },
  // Superadmin specific
  { href: '/dashboard/superadmin', label: 'Resumen Admin', icon: LayoutDashboard, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/user-management', label: 'Gestión Usuarios', icon: Users, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/course-management', label: 'Gestión Cursos', icon: BookOpen, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/platform-stats', label: 'Métricas Plataforma', icon: BarChart2, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/settings', label: 'Config. Global', icon: Settings, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/coupons', label: 'Cupones', icon: Ticket, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/security', label: 'Seguridad', icon: ShieldCheck, roles: ['superadmin'] },
];


export function DashboardSidebar() {
  const pathname = usePathname();
  const { currentUser, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const filteredNavItems = userRole ? navItems.filter(item => item.roles.includes(userRole)) : [];

  const getInitials = (name?: string | null) => {
    if (!name) return 'CC';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card text-card-foreground">
        <div className="flex h-16 items-center border-b px-6">
          <Logo />
        </div>
        <ScrollArea className="flex-1 py-4 px-4 space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </ScrollArea>
        <div className="mt-auto p-4 border-t">
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
    );
  }
  
  if (!currentUser) {
    // Or redirect, or show a message. For now, null to not render sidebar if not logged in.
    // This case should ideally be handled by route protection in DashboardLayout.
    return null; 
  }


  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-4 gap-2">
        <Avatar className="h-9 w-9">
          <AvatarImage src={currentUser.photoURL || `https://placehold.co/40x40.png?text=${getInitials(currentUser.displayName)}`} alt={currentUser.displayName || "User Avatar"} />
          <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
         <span className="text-sm font-semibold truncate">{currentUser.displayName || currentUser.email}</span>
         <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href + item.label} // Ensure key is unique if hrefs are repeated
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                // For generic /dashboard/student, make sure it highlights correctly
                (pathname === item.href || (item.href === '/dashboard/student' && pathname.startsWith('/dashboard/student'))) && 'bg-primary/10 text-primary font-semibold'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
         <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
      </div>
    </aside>
  );
}

// Custom Award Icon as lucide-react doesn't have 'Award'
function AwardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

