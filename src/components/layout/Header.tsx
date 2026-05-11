
'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react'; // Ensured useEffect is imported
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
import { BookOpen, LayoutDashboard, LogOut, UserCircle, Menu as MenuIcon, HelpCircleIcon, DollarSignIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription, SheetHeader } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../shared/ThemeToggle';


const navLinks = [
  { href: '/products', label: 'Catálogo', icon: BookOpen, isHashLink: false },
  { href: '/pricing', label: 'Precios', icon: DollarSignIcon, isHashLink: false },
  { href: '/comunidad', label: 'Comunidad', icon: HelpCircleIcon, isHashLink: false },
];

export function Header() {
  const { currentUser, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);
  }, []);


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
    if (!name) return 'CC';
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
          <Skeleton className="h-9 w-24 rounded-md hidden md:inline-flex" /> {/* Matched structure for desktop buttons */}
          <Skeleton className="h-9 w-9 rounded-full hidden md:inline-flex" /> {/* User avatar / menu trigger */}
          <Skeleton className="h-9 w-16 rounded-md md:hidden" /> {/* Mobile Login */}
          <Skeleton className="h-9 w-16 rounded-md md:hidden" /> {/* Mobile Signup */}
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
            <DropdownMenuContent align="end" className="w-56 mt-2 shadow-apple rounded-[18px] border-black/5 dark:border-white/10 p-2">
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

    // Logged out state
    return (
      <div className="flex items-center gap-3"> {/* Consistent class with loading and logged-in states */}
        <Button variant="ghost" asChild className="text-foreground/80 hover:text-foreground hidden md:inline-flex">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
        <Button asChild className="apple-btn-primary hidden md:inline-flex py-2 px-5 text-sm h-9">
          <Link href="/signup">Comenzar</Link>
        </Button>
        {/* Mobile specific login/signup buttons */}
        <div className="md:hidden flex items-center gap-2">
           <Button variant="ghost" size="sm" asChild>
             <Link href="/login">Login</Link>
           </Button>
           {/* Changed Button for mobile "Signup" to avoid asChild with Link for this specific error case */}
           <Button size="sm" onClick={() => router.push('/signup')} className="apple-btn-primary h-8 px-4 text-xs">
             Signup
           </Button>
        </div>
      </div>
    );
  };

  const renderMobileAuthSection = (closeSheet?: () => void) => {
    // No hasMounted check here; this is for the sheet which is client-side only interaction
    if (loading) {
      return <Skeleton className="h-10 w-full mt-4" />
    }
    const handleLinkClick = (href: string) => {
      router.push(href);
      if (closeSheet) closeSheet();
    };
    if (currentUser) {
      return (
        <>
          <Button variant="ghost" onClick={() => handleLinkClick('/dashboard')} className="w-full flex items-center h-10 justify-start text-sm px-3 py-1.5">Dashboard</Button>
          <Button variant="ghost" onClick={() => handleLinkClick('/dashboard/student')} className="w-full flex items-center h-10 justify-start text-sm px-3 py-1.5">Mi Perfil</Button>
          <Button variant="ghost" onClick={() => { handleLogout(); if (closeSheet) closeSheet(); }} className="w-full flex items-center h-10 justify-start text-sm px-3 py-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">Cerrar Sesión</Button>
        </>
      );
    }
    return (
      <>
        <Button variant="ghost" onClick={() => handleLinkClick('/login')} className="w-full flex items-center h-10 justify-start text-sm px-3 py-1.5">Iniciar Sesión</Button>
        <Button onClick={() => handleLinkClick('/signup')} className="w-full flex items-center h-10 justify-start text-sm px-3 py-1.5">Comenzar</Button>
      </>
    );
  }


  const isLinkActive = (href: string, isHash: boolean) => {
    if (isHash) {
      if (typeof window !== 'undefined') {
        const currentHash = window.location.hash;
        return pathname === '/' && (href === currentHash || (currentHash === '' && href === '/#'));
      }
      return false;
    }
    return pathname === href;
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-[20px] transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="hidden md:block">
            <Logo size="md" />
        </div>
        <div className="md:hidden">
            <Logo iconOnly size="md" />
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-secondary/80 dark:bg-white/10 px-1 py-1 rounded-full border border-black/5 dark:border-white/5">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "rounded-full px-4 py-1.5 text-sm",
                isLinkActive(link.href, link.isHashLink) ? "bg-white dark:bg-black text-primary shadow-sm" : "text-foreground/70 hover:text-foreground"
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          {hasMounted ? renderAuthSection() : (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-24 rounded-md hidden md:inline-flex" />
              <Skeleton className="h-9 w-9 rounded-full hidden md:inline-flex" />
              <Skeleton className="h-9 w-16 rounded-md md:hidden" />
              <Skeleton className="h-9 w-16 rounded-md md:hidden" />
            </div>
          )}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground/80 hover:text-foreground">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] flex flex-col p-0">
               <SheetHeader className="border-b p-4">
                <SheetTitle className="sr-only">Navegación Principal</SheetTitle>
                <SheetDescription className="sr-only">Enlaces principales y opciones de autenticación.</SheetDescription>
                 <Logo size="md" onClick={() => setIsSheetOpen(false)} />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 py-2 flex-grow">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center h-10 gap-2 justify-start text-sm rounded-md px-3",
                      isLinkActive(link.href, link.isHashLink)
                        ? "bg-muted text-primary font-medium"
                        : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                    )}
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t p-2 mt-auto space-y-1">
                 {renderMobileAuthSection(() => setIsSheetOpen(false))}
                 <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
