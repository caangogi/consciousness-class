import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { Header } from '@/components/layout/Header'; // Re-using main header for mobile nav, or create specific dashboard header
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu as MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
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
const currentUserRole: 'student' | 'creator' | 'superadmin' = 'student'; // Change this to test

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUserRole));
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr] lg:grid-cols-[256px_1fr]">
      <DashboardSidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-4 text-lg font-medium mt-5">
                <Link
                  href="/"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base mb-4"
                >
                  <Logo/>
                </Link>
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <Button variant="ghost" className="w-full justify-start mt-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
              </nav>
            </SheetContent>
          </Sheet>
           <div className="md:hidden">
             <Logo />
           </div>
          {/* Potentially add breadcrumbs or user menu for mobile header here */}
        </header>
        <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

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
