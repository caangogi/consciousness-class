
'use client';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { DashboardSidebar, navItems } from '@/components/dashboard/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { Menu as MenuIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { NotificationBell } from '@/components/community/NotificationBell';


const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Ficon.png?alt=media&token=5b954603-a0a1-4b06-9b3e-db85ed6d4728";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  // Controlled state for the mobile sheet so we can auto-close it on
  // route changes. Without this, tapping a nav link navigates but
  // leaves the panel open — extremely jarring on mobile.
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Logo imageUrl={LOGO_URL} altText="Consciousness Class Logo" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
          <div className="mt-4 w-64">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }
  
  // Derive a friendly page title for the mobile header. We pick the
  // nav item with the longest matching href so deeper routes like
  // `/dashboard/learning/my-bookings` beat the more generic
  // `/dashboard/learning`. Fallback: "Dashboard".
  const activeNavItem = filteredNavItems
    .filter((item) =>
      typeof pathname === 'string' &&
      (pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href)))
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  const pageTitle = activeNavItem?.label ?? 'Dashboard';

  return (
    <div className="grid fixed inset-0 w-full md:grid-cols-[256px_1fr] lg:grid-cols-[256px_1fr] overflow-hidden bg-background">
      <DashboardSidebar />
      <div className="flex flex-col h-full overflow-hidden">
        {/* Mobile header (<768px). Hidden on md+ where the sidebar takes over. */}
        <header className="flex h-14 items-center gap-2 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-2xl px-3 md:hidden sticky top-0 z-40">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 -ml-1"
                aria-label="Abrir menú de navegación"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] flex flex-col p-0">
              <SheetHeader className="border-b border-black/5 dark:border-white/10 p-4">
                <SheetTitle className="sr-only">Navegación del Dashboard</SheetTitle>
                <SheetDescription className="sr-only">Enlaces y opciones del panel de control.</SheetDescription>
                <div className="flex items-center gap-3 text-left">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={currentUser.photoURL || `https://placehold.co/40x40.png?text=${getInitials(currentUser.displayName)}`}
                      alt={currentUser.displayName || 'User Avatar'}
                    />
                    <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden min-w-0">
                    <span className="text-sm font-semibold truncate">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                  </div>
                </div>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 py-3 flex-grow overflow-y-auto">
                {filteredNavItems.map((item) => {
                  const isActive = typeof pathname === 'string' && typeof item.href === 'string' &&
                    (pathname === item.href ||
                     (item.href !== '/dashboard' &&
                      item.href !== '/dashboard/creator' &&
                      item.href !== '/dashboard/student' &&
                      item.href !== '/dashboard/superadmin' &&
                      pathname.startsWith(item.href)));
                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      className={cn(
                        'flex items-center h-11 gap-3 rounded-lg px-3 text-secondary-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm',
                        isActive && 'bg-primary text-white font-medium hover:text-white hover:bg-primary/90 shadow-sm'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : item.colorClass || 'text-muted-foreground')} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-black/5 dark:border-white/10 p-3 mt-auto flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex-1 justify-start h-10 px-3 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Current page title — gives the user a "you are here" anchor.
              Truncates gracefully on small phones. */}
          <h1 className="text-base font-semibold text-foreground truncate flex-1 min-w-0">
            {pageTitle}
          </h1>

          <div className="flex items-center gap-0.5 -mr-1">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background overflow-auto">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
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
