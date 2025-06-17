
'use client';

import Link from 'next/link';
import React from 'react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, LayoutDashboard, LogOut, UserCircle, Menu as MenuIcon, Briefcase, MessageCircleQuestion, Home, HelpCircleIcon, DollarSignIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const navLinks = [
  { href: '/courses', label: 'Cursos', icon: BookOpen, isHashLink: false },
  { href: '/#pricing', label: 'Precios', icon: DollarSignIcon, isHashLink: true },
  { href: '/#faq', label: 'FAQ', icon: HelpCircleIcon, isHashLink: true },
];

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/consciousness-class.firebasestorage.app/o/WEB%2Flogo.png?alt=media&token=32e66a51-6809-4b4c-83bd-98e16bc84339";

export function Header() {
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

  const getInitials = (name?: string | null) => {
    if (!name) return 'CC'; // Updated fallback initials
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderAuthSection = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      );
    }

    if (currentUser) {
      return (
        <div className="flex items-center gap-3">
           <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border-2 border-border hover:border-primary transition-colors">
                  <AvatarImage src={currentUser.photoURL || `https://placehold.co/40x40.png?text=${getInitials(currentUser.displayName)}`} alt={currentUser.displayName || "User Avatar"} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(currentUser.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 shadow-soft-xl">
              <DropdownMenuLabel>
                <p className="font-medium truncate">{currentUser.displayName || currentUser.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard Principal</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/student"><UserCircle className="mr-2 h-4 w-4" />Mi Perfil</Link>
              </DropdownMenuItem>
              {userRole === 'student' && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/student"><BookOpen className="mr-2 h-4 w-4" />Mis Cursos</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild className="rounded-full shadow-sm hover:shadow-md transition-shadow bg-foreground text-background hover:bg-foreground/80">
          <Link href="/signup">Comenzar</Link>
        </Button>
      </div>
    );
  };

  const renderMobileAuthSection = (closeSheet?: () => void) => {
    if (loading) {
      return <Skeleton className="h-8 w-full mt-4" />
    }
    const handleLinkClick = (href: string) => {
      router.push(href);
      if (closeSheet) closeSheet();
    };
    if (currentUser) {
      return (
        <>
          <Button variant="ghost" onClick={() => handleLinkClick('/dashboard')} className="w-full justify-start py-2.5 text-base">Dashboard</Button>
          <Button variant="ghost" onClick={() => handleLinkClick('/dashboard/student')} className="w-full justify-start py-2.5 text-base">Mi Perfil</Button>
          <Button variant="ghost" onClick={() => { handleLogout(); if (closeSheet) closeSheet(); }} className="w-full justify-start py-2.5 text-base text-destructive hover:text-destructive hover:bg-destructive/10">Cerrar Sesión</Button>
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" onClick={() => handleLinkClick('/login')} className="w-full justify-start py-2.5 text-base">Iniciar Sesión</Button>
        <Button onClick={() => handleLinkClick('/signup')} className="w-full py-2.5 text-base">Comenzar</Button>
      </>
    );
  }

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const isLinkActive = (href: string, isHash: boolean) => {
    if (isHash) {
      // For hash links, consider active if it's the homepage and potentially check hash later if needed
      // For simplicity, let's assume if on homepage, hash links are contextually "active"
      return pathname === '/'; 
    }
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-[72px] items-center justify-between">
        <Logo imageUrl={LOGO_URL} altText="Consciousness Class Logo" />

        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 px-2 py-1.5 rounded-full shadow-sm">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "rounded-full px-4 py-1.5 text-sm",
                isLinkActive(link.href, link.isHashLink) ? "bg-background text-primary shadow-sm" : "text-foreground/70 hover:text-foreground hover:bg-background/70"
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          {renderAuthSection()}

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] flex flex-col p-0"> {/* Removed p-6 from here */}
              <SheetHeader className="border-b p-4"> {/* Added padding to header */}
                <SheetTitle className="sr-only">Navegación Principal</SheetTitle>
                <SheetDescription className="sr-only">Enlaces principales y opciones de autenticación.</SheetDescription>
                 <Logo imageUrl={LOGO_URL} altText="Consciousness Class Logo" onClick={() => setIsSheetOpen(false)}/>
              </SheetHeader>
              <nav className="grid gap-1 p-4 flex-grow"> {/* Reduced gap, added padding to nav */}
                {navLinks.map((link) => (
                  <Button
                    key={link.label}
                    variant={isLinkActive(link.href, link.isHashLink) ? "secondary" : "ghost"}
                    asChild
                    className="justify-start text-base h-auto py-2.5 px-3 rounded-md" // Adjusted padding & height
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <Link href={link.href} className="flex items-center gap-3">
                       <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary"/>
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              <div className="border-t p-4 space-y-2"> {/* Reduced spacing */}
                 {renderMobileAuthSection(() => setIsSheetOpen(false))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

    