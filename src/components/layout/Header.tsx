import Link from 'next/link';
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
import { BookOpen, LayoutDashboard, LogOut, UserCircle, Search, Menu as MenuIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '../ui/input';

const navLinks = [
  { href: '/courses', label: 'Cursos' },
  { href: '/#pricing', label: 'Precios' }, // Assuming pricing section on home
  { href: '/#faq', label: 'FAQ' }, // Assuming FAQ section on home
];

// TODO: Replace with actual authentication state
const isAuthenticated = false; 
const userRole = 'student'; // 'student', 'creator', 'superadmin'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-foreground/70 transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
             {/* <Input type="search" placeholder="Buscar cursos..." className="h-9 w-[200px] lg:w-[250px]" />
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button> */}
          </div>
         
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                    <AvatarFallback>MB</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/student"><UserCircle className="mr-2 h-4 w-4" />Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/student"><BookOpen className="mr-2 h-4 w-4" />Mis Cursos</Link>
                </DropdownMenuItem>
                {userRole !== 'student' && (
                  <DropdownMenuItem asChild>
                    <Link href={userRole === 'creator' ? '/dashboard/creator' : '/dashboard/superadmin'}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Registrarse</Link>
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <Logo />
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2"/>
                 {isAuthenticated ? (
                    <>
                      <Link href="/dashboard/student" className="text-muted-foreground transition-colors hover:text-foreground">Perfil</Link>
                      <Link href="/dashboard/student" className="text-muted-foreground transition-colors hover:text-foreground">Mis Cursos</Link>
                      {userRole !== 'student' && (
                         <Link href={userRole === 'creator' ? '/dashboard/creator' : '/dashboard/superadmin'} className="text-muted-foreground transition-colors hover:text-foreground">Dashboard</Link>
                      )}
                       <Button variant="ghost">Cerrar Sesión</Button>
                    </>
                 ) : (
                    <>
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link href="/login">Iniciar Sesión</Link>
                      </Button>
                      <Button asChild className="w-full justify-start">
                        <Link href="/signup">Registrarse</Link>
                      </Button>
                    </>
                 )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
