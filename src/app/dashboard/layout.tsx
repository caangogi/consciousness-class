
'use client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
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


const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Flogo.png?alt=media&token=5753a168-614a-4060-baa4-4296d4062f14";


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/dashboard');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
       <div className="flex h-screen items-center justify-center">
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
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[256px_1fr] lg:grid-cols-[256px_1fr]">
      <DashboardSidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs flex flex-col p-0">
             <SheetHeader className="border-b p-4"> 
                <SheetTitle className="sr-only">Navegación del Dashboard</SheetTitle>
                <SheetDescription className="sr-only">Enlaces y opciones del panel de control.</SheetDescription>
                 <Logo imageUrl={LOGO_URL} altText="Consciousness Class Logo" width={120} height={32}/>
             </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 py-2 flex-grow overflow-y-auto">
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
                          "flex items-center h-10 gap-3 rounded-lg px-3 text-muted-foreground hover:text-foreground transition-colors text-sm",
                          isActive && 'bg-primary/10 text-primary font-semibold'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t p-2 mt-auto">
                <Button variant="ghost" onClick={handleLogout} className="w-full flex items-center h-10 justify-start px-3 text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
           <div className="md:hidden">
            {/*  <Logo imageUrl={LOGO_URL} altText="Consciousness Class Logo" /> */}
           </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
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
