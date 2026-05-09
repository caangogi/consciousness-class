'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Mic, Download, PlayCircle, Users, Briefcase, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AssetOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  isAvailable: boolean;
  bgImage: string;
  gridClass: string;
}

const assetOptions: AssetOption[] = [
  {
    id: 'course',
    title: 'Curso Grabado',
    description: 'Estructura módulos, sube lecciones en video y materiales para que tus estudiantes aprendan a su ritmo.',
    icon: PlayCircle,
    href: '/dashboard/builder/course',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    gridClass: 'lg:col-start-2 lg:col-span-1 lg:row-start-1 lg:row-span-2 min-h-[300px] lg:min-h-full',
  },
  {
    id: 'membership',
    title: 'Membresía',
    description: 'Crea contenido exclusivo de acceso recurrente con cobro mensual o anual.',
    icon: Users,
    href: '/dashboard/builder/membership',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2600&auto=format&fit=crop',
    gridClass: 'lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-2 min-h-[300px] lg:min-h-full',
  },
  {
    id: 'download',
    title: 'Descarga Digital',
    description: 'Vende E-books, PDFs, plantillas de Notion o archivos de audio.',
    icon: Download,
    href: '/dashboard/builder/download',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2600&auto=format&fit=crop',
    gridClass: 'lg:col-start-1 lg:col-span-1 lg:row-start-3 lg:row-span-1 min-h-[220px]',
  },
  {
    id: 'community',
    title: 'Comunidad',
    description: 'Crea un espacio privado de transformación y conexión guiada.',
    icon: BookOpen,
    href: '/dashboard/builder/community',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2500&auto=format&fit=crop',
    gridClass: 'lg:col-start-3 lg:col-span-1 lg:row-start-1 lg:row-span-1 min-h-[220px]',
  },
  {
    id: 'coaching',
    title: 'Asesoría / Coaching',
    description: 'Vende sesiones 1-a-1 en vivo con calendario automatizado y seguimientos.',
    icon: Briefcase,
    href: '/dashboard/builder/coaching',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2600&auto=format&fit=crop',
    gridClass: 'lg:col-start-3 lg:col-span-1 lg:row-start-2 lg:row-span-2 min-h-[300px] lg:min-h-full',
  },
  {
    id: 'podcast',
    title: 'Podcast Premium',
    description: 'Sube episodios exclusivos que los estudiantes pueden escuchar en alta calidad.',
    icon: Mic,
    href: '/dashboard/builder/podcast',
    isAvailable: true,
    bgImage: 'https://images.unsplash.com/photo-1614113489855-66422ad300a4?q=80&w=2600&auto=format&fit=crop',
    gridClass: 'lg:col-start-2 lg:col-span-1 lg:row-start-3 lg:row-span-1 min-h-[220px]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function NewProductWizard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="mb-10 text-center flex flex-col items-center">
         <Button asChild variant="ghost" className="mb-6 text-secondary-foreground hover:text-foreground ios-button">
            <Link href="/dashboard/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Mis Productos
            </Link>
         </Button>
         <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">¿Qué quieres crear hoy?</h1>
         <p className="text-lg text-secondary-foreground mt-2 max-w-2xl font-light">
           Elige el formato de activo que mejor se adapte a tu conocimiento. Construye experiencias excepcionales de aprendizaje y monetización.
         </p>
      </div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:auto-rows-[250px]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {assetOptions.map((option) => (
          <motion.div 
             key={option.id} 
             variants={itemVariants}
             className={cn(
               "relative group overflow-hidden rounded-[32px] border border-white/10 dark:border-white/5 bg-black/50 transition-all duration-500",
               option.isAvailable ? "hover:border-white/20 hover:shadow-[0_0_40px_-15px_rgba(255,255,255,0.2)] hover:-translate-y-1 cursor-pointer" : "opacity-50 grayscale cursor-not-allowed",
               option.gridClass
             )}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-50 dark:opacity-40"
              style={{ backgroundImage: `url(${option.bgImage})` }}
            />
            
            {/* Dark/Glass Gradient Overlay for readability */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute inset-0 z-0 bg-black/20" />
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-radial-gradient from-white/5 to-transparent pointer-events-none" />

            {/* Clickable Area Overlay */}
            {option.isAvailable ? (
               <Link href={option.href} className="absolute inset-0 z-20" aria-label={`Crear ${option.title}`} />
            ) : null}
            
            <div className="relative z-10 flex flex-col h-full justify-end p-8">
               <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl group-hover:bg-white/20 transition-colors duration-500">
                     <option.icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  {!option.isAvailable && (
                     <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-[11px] font-medium tracking-widest shadow-sm border border-white/5 uppercase">
                        Próximamente
                     </div>
                  )}
               </div>

               <div className="mt-auto transform transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="text-2xl font-semibold text-white tracking-tight mb-3">
                    {option.title}
                  </h3>
                  <p className="text-[15px] text-white/70 leading-relaxed font-light line-clamp-2 md:line-clamp-none">
                     {option.description}
                  </p>
               </div>
               
               {option.isAvailable && (
                  <div className="mt-4 flex items-center text-sm font-medium text-white/90 group-hover:text-white transition-colors overflow-hidden">
                     <span className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-100">
                       Iniciar creación
                     </span>
                     <ArrowUpRight className="ml-2 h-4 w-4 transform -translate-x-4 translate-y-4 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out delay-150" />
                  </div>
               )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

