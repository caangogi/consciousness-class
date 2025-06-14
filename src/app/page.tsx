
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MapPin, MessageSquare, Plus, User, Zap, Award, Users as UsersIcon, Clock } from 'lucide-react'; // Added Award, UsersIcon, Clock
import { motion } from 'framer-motion';
import { CourseCard, type CourseCardData } from '@/components/CourseCard'; // Import CourseCard
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

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

const featuredCoursesData: CourseCardData[] = [
  {
    id: 'course-1',
    nombre: 'Desarrollo Web Moderno con React y Next.js',
    descripcionCorta: 'Aprende a construir aplicaciones web rápidas y escalables con las tecnologías más demandadas.',
    precio: 79.99,
    imagenPortadaUrl: 'https://placehold.co/600x400.png',
    dataAiHintImagenPortada: 'web development react',
    categoria: 'Desarrollo Web',
    duracionEstimada: '40 horas',
    ratingPromedio: 4.9,
    totalEstudiantes: 1250,
    creadorNombre: 'Carlos Estevez',
  },
  {
    id: 'course-2',
    nombre: 'Mindfulness y Reducción de Estrés (MBSR)',
    descripcionCorta: 'Descubre técnicas de mindfulness para mejorar tu bienestar y manejar el estrés diario.',
    precio: 49.00,
    imagenPortadaUrl: 'https://placehold.co/600x400.png',
    dataAiHintImagenPortada: 'mindfulness meditation',
    categoria: 'Bienestar',
    duracionEstimada: '8 semanas',
    ratingPromedio: 4.8,
    totalEstudiantes: 870,
    creadorNombre: 'Elena García',
  },
  {
    id: 'course-3',
    nombre: 'Introducción a la Inteligencia Artificial',
    descripcionCorta: 'Explora los fundamentos de la IA y sus aplicaciones prácticas en el mundo real.',
    precio: 99.50,
    imagenPortadaUrl: 'https://placehold.co/600x400.png',
    dataAiHintImagenPortada: 'artificial intelligence',
    categoria: 'Tecnología',
    duracionEstimada: '30 horas',
    ratingPromedio: 4.7,
    totalEstudiantes: 920,
    creadorNombre: 'Dr. Alan Turing Jr.',
  },
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
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {featuredCoursesData.map((course, index) => (
              <motion.div key={course.id} variants={itemVariants} className="flex">
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
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
        </div>
      </motion.section>

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
