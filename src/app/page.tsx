
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MapPin, MessageSquare, Plus, User, Zap, Award, Users as UsersIcon, Clock, Edit3, Loader2 } from 'lucide-react'; // Added Award, UsersIcon, Clock, Edit3, Loader2
import { motion } from 'framer-motion';
import { CourseCard, type CourseCardData } from '@/components/CourseCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 12,
    },
  },
};

const floatingItemVariants = (delay = 0) => ({
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15, delay: 0.5 + delay } 
  },
});

const partnerLogos = [
  { name: 'Tech Innovators', src: 'https://placehold.co/100x40.png', dataAiHint: 'tech logo' },
  { name: 'Future Learn Co.', src: 'https://placehold.co/100x40.png', dataAiHint: 'education logo' },
  { name: 'Synergy Solutions', src: 'https://placehold.co/100x40.png', dataAiHint: 'solutions logo' },
  { name: 'Global Education', src: 'https://placehold.co/100x40.png', dataAiHint: 'global logo' },
  { name: 'NextGen Skills', src: 'https://placehold.co/100x40.png', dataAiHint: 'skills logo' },
];

const keyBenefits = [
  {
    icon: Zap,
    title: "Aprende a Tu Ritmo",
    description: "Accede a los cursos cuando quieras y donde quieras, adaptando el aprendizaje a tu horario.",
    dataAiHint: "flexible learning icon"
  },
  {
    icon: UsersIcon,
    title: "Instructores Expertos",
    description: "Contenido creado y enseñado por profesionales con experiencia real en sus campos.",
    dataAiHint: "expert teacher icon"
  },
  {
    icon: MessageSquare,
    title: "Comunidad Vibrante",
    description: "Conecta, colabora y crece junto a otros estudiantes y creators apasionados.",
    dataAiHint: "community chat icon"
  },
  {
    icon: Award,
    title: "Certificación Profesional",
    description: "Obtén certificados al completar tus cursos y valida tus nuevas habilidades.",
    dataAiHint: "certificate award icon"
  }
];

const testimonials = [
  {
    id: 't1',
    name: 'Laura Fernández',
    role: 'Desarrolladora Web',
    avatarUrl: 'https://placehold.co/80x80.png',
    dataAiHint: 'woman portrait',
    quote: "MentorBloom me ayudó a actualizar mis habilidades en React de una forma muy práctica. ¡Los cursos son de alta calidad!"
  },
  {
    id: 't2',
    name: 'Marcos Giménez',
    role: 'Emprendedor',
    avatarUrl: 'https://placehold.co/80x80.png',
    dataAiHint: 'man portrait',
    quote: "La flexibilidad de la plataforma y la calidad de los instructores han sido clave para mi desarrollo profesional."
  }
];


export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<CourseCardData[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      setIsLoadingCourses(true);
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        // Take only the first 3 courses for the homepage, or fewer if not enough available
        setFeaturedCourses(data.courses ? data.courses.slice(0, 3) : []);
      } catch (error) {
        console.error("Error fetching courses for homepage:", error);
        setFeaturedCourses([]); // Set to empty array on error
      } finally {
        setIsLoadingCourses(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <motion.section 
        className="relative flex-grow flex items-center justify-center py-20 md:py-32 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="absolute top-1/4 left-[10%] md:left-[15%]"
          variants={floatingItemVariants(0.1)}
          initial="initial"
          animate="animate"
        >
          <Image src="https://placehold.co/120x120.png" alt="Abstract Plus" width={100} height={100} data-ai-hint="abstract 3D plus" className="opacity-70" />
        </motion.div>

        <motion.div 
          className="absolute bottom-[15%] left-[5%] md:left-[10%]"
          variants={floatingItemVariants(0.3)}
          initial="initial"
          animate="animate"
        >
          <Image src="https://placehold.co/150x150.png" alt="Abstract Location Pin" width={130} height={130} data-ai-hint="3D location pin" className="opacity-70" />
           <motion.div 
            className="absolute -bottom-5 -right-5 md:-bottom-2 md:-right-8 bg-foreground text-background text-xs px-3 py-1.5 rounded-full shadow-soft-xl flex items-center gap-1"
            variants={floatingItemVariants(0.7)}
            initial="initial"
            animate="animate"
           >
            <MapPin size={14} /> Comunidad Global
          </motion.div>
        </motion.div>

        <motion.div 
          className="absolute top-[15%] right-[5%] md:right-[10%] w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64"
           variants={floatingItemVariants(0.2)}
           initial="initial"
           animate="animate"
        >
          <Image src="https://placehold.co/250x250.png" alt="Abstract Thumbs Up" width={250} height={250} data-ai-hint="3D thumbs up" className="opacity-60" />
        </motion.div>

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <motion.div 
            className="inline-flex items-center gap-2 bg-secondary/70 text-secondary-foreground px-4 py-2 rounded-full text-sm mb-6 shadow-sm"
            variants={itemVariants}
          >
            <User size={16} className="text-primary"/> MentorBloom Platform
          </motion.div>
          <motion.h1 
            className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 text-foreground leading-tight"
            variants={itemVariants}
          >
            Eleva tu aprendizaje,
            <br className="hidden md:block" /> transforma tu <span 
              className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent relative inline-block
                         animate-backgroundShine bg-[200%_auto]"
            >
              potencial.
            </span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-10"
            variants={itemVariants}
          >
            Descubre cursos online de alta calidad y únete a una comunidad vibrante enfocada en el crecimiento y la conciencia.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Button size="lg" asChild className="rounded-full px-8 py-6 text-base shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-500 text-primary-foreground">
              <Link href="/courses">Explorar Cursos <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 py-6 text-base shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105 border-2 hover:bg-secondary/70">
              <Link href="/signup?role=creator">Ser Creator <Zap className="ml-2 h-5 w-5 text-accent" /></Link>
            </Button>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-10 right-10 hidden lg:flex items-center gap-2 text-xs text-muted-foreground animate-bounce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.5} }}
          >
            Scroll
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
              <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="8" cy="6" r="1.25" fill="currentColor"/>
            </svg>
          </motion.div>

           <motion.div 
            className="absolute top-24 right-16 hidden xl:flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs shadow-soft-xl"
            variants={floatingItemVariants(0.5)}
            initial="initial"
            animate="animate"
          >
             <MessageSquare size={14} className="text-accent"/> Drop us a line
          </motion.div>
          <motion.div 
            className="absolute bottom-36 left-24 hidden xl:flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs shadow-soft-xl"
            variants={floatingItemVariants(0.6)}
            initial="initial"
            animate="animate"
          >
             <CheckCircle size={14} className="text-green-500"/> Check our work
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Courses Section */}
      <motion.section 
        className="py-16 md:py-24 bg-secondary/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2 
            className="font-headline text-3xl md:text-4xl font-bold text-center mb-4"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            Cursos Destacados para <span className="text-primary">Impulsar Tu Crecimiento</span>
          </motion.h2>
          <motion.p 
            className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-12"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            Seleccionados por nuestros expertos para ofrecerte el mejor contenido y transformar tus habilidades.
          </motion.p>
          
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col overflow-hidden shadow-lg rounded-lg bg-card">
                  <Skeleton className="aspect-[16/9] w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="p-5 border-t bg-secondary/30 flex justify-between items-center">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-9 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCourses.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {featuredCourses.map((course) => (
                <motion.div key={course.id} variants={itemVariants} className="flex">
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-10 bg-card rounded-xl shadow-md"
              variants={itemVariants} initial="hidden" whileInView="visible" viewport={{once: true, amount: 0.5}}
            >
              <Edit3 size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Sé el Primero en Crear un Curso!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Actualmente no hay cursos destacados. ¿Tienes conocimiento para compartir? Únete como creator.</p>
              <Button size="lg" asChild className="rounded-full">
                <Link href="/signup?role=creator">Conviértete en Creator <Zap className="ml-2 h-5 w-5" /></Link>
              </Button>
            </motion.div>
          )}

          {featuredCourses.length > 0 && (
            <motion.div 
              className="text-center mt-12"
              initial={{ opacity:0, y: 20 }}
              whileInView={{ opacity:1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button size="lg" asChild className="rounded-full px-8 py-6 text-base shadow-md hover:shadow-lg transition-shadow">
                <Link href="/courses">Ver Todos los Cursos <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Become a Creator CTA Section */}
      { (isLoadingCourses || featuredCourses.length === 0) && ( // Show CTA if no courses or still loading
        <motion.section
          className="py-16 md:py-24 bg-primary/5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4 md:px-6 text-center">
            <motion.div
              variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
            >
              <Zap size={48} className="mx-auto text-primary mb-6" />
              <h2 className="font-headline text-3xl md:text-4xl font-bold mb-5">¿Tienes Conocimiento para Compartir?</h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
                Únete a MentorBloom como Creator y transforma tu experiencia en cursos online impactantes. Ayuda a otros a crecer mientras generas ingresos.
              </p>
              <Button size="lg" asChild className="rounded-full px-10 py-7 text-lg shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/signup?role=creator">
                  Conviértete en Creator Hoy
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>
      )}


      {/* Key Benefits Section */}
      <motion.section 
        className="py-16 md:py-24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2 
            className="font-headline text-3xl md:text-4xl font-bold text-center mb-4"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Descubre lo que <span className="text-primary">MentorBloom</span> Te Ofrece
          </motion.h2>
          <motion.p 
            className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-16"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Hemos diseñado nuestra plataforma pensando en tus necesidades de aprendizaje y crecimiento.
          </motion.p>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
          >
            {keyBenefits.map((benefit, index) => (
              <motion.div 
                key={benefit.title} 
                variants={itemVariants}
                className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-soft-xl hover:shadow-soft-2xl transition-shadow duration-300"
              >
                <div className="p-4 bg-primary/10 rounded-full mb-5">
                  <benefit.icon className="h-8 w-8 text-primary" data-ai-hint={benefit.dataAiHint} />
                </div>
                <h3 className="text-xl font-headline font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        className="py-16 md:py-24 bg-secondary/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.h2 
            className="font-headline text-3xl md:text-4xl font-bold text-center mb-4"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Lo que Dicen <span className="text-primary">Nuestros Estudiantes</span>
          </motion.h2>
          <motion.p 
            className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-16"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Experiencias reales de personas que están transformando sus vidas con MentorBloom.
          </motion.p>
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
          >
            {testimonials.map((testimonial) => (
              <motion.div 
                key={testimonial.id}
                variants={itemVariants}
                className="bg-card p-8 rounded-xl shadow-soft-xl"
              >
                <p className="text-muted-foreground italic mb-6 relative">
                  <span className="text-4xl text-primary/50 absolute -top-2 -left-4 font-serif">“</span>
                  {testimonial.quote}
                  <span className="text-4xl text-primary/50 absolute -bottom-6 -right-0 font-serif">”</span>
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold font-headline">{testimonial.name}</p>
                    <p className="text-sm text-primary">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>


      {/* Partner Logos Section - Kept from previous version if desired */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <h3 className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Con la confianza de educadores y aprendices
          </h3>
          <motion.div 
            className="flex flex-wrap justify-center items-center gap-x-8 gap-y-6 md:gap-x-12 lg:gap-x-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
          >
            {partnerLogos.map((logo) => (
              <motion.div key={logo.name} variants={itemVariants} className="grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300">
                <Image src={logo.src} alt={logo.name} width={100} height={30} data-ai-hint={logo.dataAiHint} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

       {/* Final CTA Section */}
      <motion.section 
        className="py-20 md:py-32 bg-gradient-to-br from-primary/80 to-blue-500/80 text-primary-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container mx-auto px-4 md:px-6 text-center relative">
           <motion.div 
            className="absolute -top-16 left-1/2 -translate-x-1/2  w-32 h-32 md:w-40 md:h-40 opacity-20"
            animate={{ rotate: 360, transition: { duration: 20, repeat: Infinity, ease: "linear" } }}
          >
            <Image src="https://placehold.co/200x200.png" alt="Decorative element" width={160} height={160} data-ai-hint="white swirl" />
          </motion.div>
          <motion.h2 
            className="font-headline text-3xl md:text-5xl font-bold mb-6"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            ¿Listo para Iniciar tu Viaje de Aprendizaje?
          </motion.h2>
          <motion.p 
            className="text-lg md:text-xl max-w-xl mx-auto mb-10 opacity-90"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Únete a miles de estudiantes y creators que están alcanzando sus metas con MentorBloom.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Button size="lg" asChild className="rounded-full px-8 py-6 text-base bg-background text-primary hover:bg-background/90 shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/signup">Comenzar Gratis Ahora</Link>
              </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Button size="lg" variant="outline" asChild className="rounded-full px-8 py-6 text-base border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/courses">Explorar Cursos</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
