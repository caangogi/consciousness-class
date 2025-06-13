
'use client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { DashboardSidebar, navItems } from '@/components/dashboard/DashboardSidebar'; // Import navItems
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet'; // Added SheetHeader
import { Menu as MenuIcon, LogOut } from 'lucide-react'; // Removed unused icons
import Link from 'next/link';
import { Logo } from '@/components/shared/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// NavItem type is implicitly available via navItems import if DashboardSidebar exports it,
// or defined locally if needed. For now, assume navItems from DashboardSidebar is sufficient.

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Flogo.png?alt=media&token=32e66a51-6809-4b4c-83bd-98e16bc84339";


export default function DashboardLayout({ children }: { children: ReactNode }) {
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
  
  // Use the imported navItems and filter based on userRole
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
          <Logo imageUrl={LOGO_URL} altText="MentorBloom Logo" />
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
            <SheetContent side="left" className="sm:max-w-xs flex flex-col">
             <SheetHeader className="sr-only"> {/* Oculto visualmente */}
                <SheetTitle>Navegación del Dashboard</SheetTitle>
                <SheetDescription>Enlaces y opciones del panel de control.</SheetDescription>
             </SheetHeader>
              <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={currentUser.photoURL || `https://placehold.co/40x40.png?text=${getInitials(currentUser.displayName)}`} alt={currentUser.displayName || "User Avatar"} />
                    <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
                </Avatar>
                 <div className="overflow-hidden"> {/* Added overflow-hidden */}
                    <p className="font-medium text-sm truncate">{currentUser.displayName || currentUser.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <nav className="grid gap-3 text-base font-medium flex-grow overflow-y-auto">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.href + item.label} // Ensure key is unique
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start mt-auto border-t pt-4">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </SheetContent>
          </Sheet>
           <div className="md:hidden">
             <Logo imageUrl={LOGO_URL} altText="MentorBloom Logo" />
           </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// AwardIcon can remain here or be moved to a shared icons file if used elsewhere.
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
