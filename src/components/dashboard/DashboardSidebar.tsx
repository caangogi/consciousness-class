'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  MessageSquare
} from 'lucide-react';

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
  { href: '/dashboard/student/my-courses', label: 'Mis Cursos', icon: BookOpen, roles: ['student'] },
  { href: '/dashboard/student/profile', label: 'Mi Perfil', icon: UserCircle, roles: ['student'] },
  { href: '/dashboard/student/referrals', label: 'Mis Referidos', icon: Gift, roles: ['student'] },
  { href: '/dashboard/student/certificates', label: 'Certificados', icon: AwardIcon, roles: ['student'] },
  // Creator specific
  { href: '/dashboard/creator/courses', label: 'Gestionar Cursos', icon: Edit3, roles: ['creator'] },
  { href: '/dashboard/creator/lessons', label: 'Gestionar Lecciones', icon: Palette, roles: ['creator'] },
  { href: '/dashboard/creator/stats', label: 'Estadísticas', icon: BarChart2, roles: ['creator'] },
  { href: '/dashboard/creator/referral-config', label: 'Config. Referidos', icon: Settings, roles: ['creator'] },
  { href: '/dashboard/creator/earnings', label: 'Ingresos', icon: DollarSign, roles: ['creator'] },
  { href: '/dashboard/creator/comments', label: 'Comentarios', icon: MessageSquare, roles: ['creator'] },
  // Superadmin specific
  { href: '/dashboard/superadmin/user-management', label: 'Gestión Usuarios', icon: Users, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/course-management', label: 'Gestión Cursos', icon: BookOpen, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/platform-stats', label: 'Métricas Plataforma', icon: BarChart2, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/settings', label: 'Config. Global', icon: Settings, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/coupons', label: 'Cupones', icon: Ticket, roles: ['superadmin'] },
  { href: '/dashboard/superadmin/security', label: 'Seguridad', icon: ShieldCheck, roles: ['superadmin'] },
];

// Placeholder for current user role
const currentUserRole: 'student' | 'creator' | 'superadmin' = 'student'; // Change this to test different roles

export function DashboardSidebar() {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUserRole));

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r bg-card text-card-foreground">
      <div className="flex h-16 items-center border-b px-6">
        <Logo />
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10',
                pathname === item.href && 'bg-primary/10 text-primary font-semibold'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
         <Button variant="ghost" className="w-full justify-start">
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
