
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
  PlusCircle, // Added for "Crear Nuevo Curso"
  Sparkles,
  Calendar,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
// Sheet components are not directly used here for the main sidebar, but might be for mobile in layout
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { NotificationBell } from '@/components/community/NotificationBell';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: ('student' | 'creator' | 'admin' | 'superadmin')[];
  subItems?: NavItem[];
  colorClass?: string;
}

// This navItems array is now the single source of truth for navigation structure
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['student', 'creator', 'admin', 'superadmin'], colorClass: 'text-brand-chambray dark:text-brand-chambray' },
  { href: '/dashboard/learning', label: 'Mis Cursos', icon: BookOpen, roles: ['student', 'admin', 'superadmin'], colorClass: 'text-brand-terracotta dark:text-brand-terracotta' },
  { href: '/dashboard/learning/my-bookings', label: 'Mis Reservas', icon: CalendarCheck, roles: ['student', 'admin', 'superadmin'], colorClass: 'text-brand-chambray dark:text-brand-chambray' },
  { href: '/dashboard/products', label: 'Mis Productos', icon: BookOpen, roles: ['creator', 'admin', 'superadmin'], colorClass: 'text-brand-terracotta dark:text-brand-terracotta' },
  { href: '/dashboard/availability', label: 'Mi Agenda', icon: Calendar, roles: ['creator', 'admin', 'superadmin'], colorClass: 'text-brand-chambray dark:text-brand-chambray' },
  { href: '/dashboard/users', label: 'Usuarios', icon: Users, roles: ['admin', 'superadmin'], colorClass: 'text-brand-clove dark:text-brand-sandstone' },
  { href: '/dashboard/finances', label: 'Finanzas', icon: DollarSign, roles: ['creator', 'admin', 'superadmin'], colorClass: 'text-brand-chambray dark:text-brand-chambray' },
  { href: '/dashboard/settings/ai', label: 'Modelos IA', icon: Sparkles, roles: ['admin', 'superadmin'], colorClass: 'text-brand-chambray dark:text-brand-chambray' },
  { href: '/dashboard/settings', label: 'Ajustes Generales', icon: Settings, roles: ['student', 'creator', 'admin', 'superadmin'] },
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
      <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card text-card-foreground h-full overflow-hidden">
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
    return null; 
  }


  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-black/5 dark:border-white/10 bg-secondary/30 dark:bg-black/20 backdrop-blur-3xl text-foreground h-full overflow-hidden">
      <div className="flex h-16 items-center justify-between border-b border-black/5 dark:border-white/10 px-4 gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.photoURL || `https://placehold.co/40x40.png?text=${getInitials(currentUser.displayName)}`} alt={currentUser.displayName || "User Avatar"} />
            <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
           <span className="text-sm font-semibold truncate">{currentUser.displayName || currentUser.email}</span>
           <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href + item.label} 
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-secondary-foreground transition-all hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 ios-button group',
                (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ) && 'bg-primary text-white font-medium hover:text-white hover:bg-primary/90'
              )}
            >
              <item.icon className={cn("h-4 w-4 transition-colors", 
                (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ) 
                  ? "text-white" 
                  : item.colorClass || "text-muted-foreground group-hover:text-foreground"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 py-6 border-t border-black/5 dark:border-white/10">
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
