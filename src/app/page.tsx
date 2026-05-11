
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MapPin, MessageSquare, Plus, User, Zap, Award, Users as UsersIcon, Clock, Edit3, Loader2, Percent, DollarSign, Wand2, BookOpen, HelpCircleIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CourseCard, type CourseCardData } from '@/components/CourseCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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

const creatorBenefitsDetailed = [
  {
    icon: Percent,
    title: "Controla Tus Ingresos",
    description: "Define comisiones por referido para tus cursos y recibe pagos de forma transparente y automatizada con Stripe.",
    dataAiHint: "commission percent icon"
  },
  {
    icon: DollarSign,
    title: "Pagos Simplificados",
    description: "Integramos Stripe para que recibas tus ganancias directamente, sin complicaciones y de manera segura.",
    dataAiHint: "automatic payment icon"
  },
  {
    icon: Wand2,
    title: "Herramientas Intuitivas",
    description: "Nuestra plataforma te facilita crear, gestionar y promocionar tus cursos sin necesidad de conocimientos técnicos avanzados.",
    dataAiHint: "easy tools icon"
  },
  {
    icon: UsersIcon,
    title: "Comunidad y Soporte",
    description: "Únete a una red de instructores, comparte experiencias, recibe apoyo continuo y accede a recursos exclusivos.",
    dataAiHint: "creator community icon"
  }
];

const faqItems = [
  {
    id: "faq1",
    question: "¿Qué es Consciousness Class?",
    answer: "Consciousness Class es una plataforma de aprendizaje online donde puedes encontrar una amplia variedad de cursos para desarrollar nuevas habilidades y avanzar en tu carrera. También ofrecemos a los expertos la posibilidad de crear y vender sus propios cursos."
  },
  {
    id: "faq2",
    question: "¿Cómo me inscribo en un curso?",
    answer: "Simplemente navega por nuestro catálogo de cursos, elige el que te interese y sigue el proceso de inscripción. Puedes pagar por curso o, en algunos casos, acceder a través de una suscripción."
  },
  {
    id: "faq3",
    question: "¿Puedo ser instructor en Consciousness Class?",
    answer: "¡Sí! Si tienes conocimientos para compartir, te invitamos a convertirte en Creator. Ofrecemos herramientas para crear tu curso, definir precios, comisiones por referido y gestionar tus estudiantes."
  },
  {
    id: "faq4",
    question: "¿Cómo funcionan los pagos y comisiones?",
    answer: "Utilizamos Stripe para procesar todos los pagos de forma segura. Como Creator, tus ingresos (después de la comisión de la plataforma) y las comisiones por referidos se gestionan de forma transparente. Más detalles en nuestra sección para Creators."
  }
];


const testimonials = [
  {
    id: 't1',
    name: 'Laura Fernández',
    role: 'Desarrolladora Web',
    avatarUrl: 'https://placehold.co/80x80.png',
    dataAiHint: 'woman portrait',
    quote: "Consciousness Class me ayudó a actualizar mis habilidades en React de una forma muy práctica. ¡Los cursos son de alta calidad!"
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
        setFeaturedCourses(data.courses ? data.courses.slice(0, 3) : []);
      } catch (error) {
        console.error("Error fetching courses for homepage:", error);
        setFeaturedCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <motion.section
        className="relative flex-grow flex items-center justify-center py-24 md:py-36 overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Subtle dotted background — defers to content (HIG Deference) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 h-full w-full bg-background bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_45%,#000_55%,transparent_100%)]"
        />

        <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-5xl">
          <motion.div
            className="inline-flex items-center gap-2 bg-secondary/60 text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase mb-8 shadow-sm border border-border/40"
            variants={itemVariants}
          >
            <Zap size={14} className="text-brand-terracotta"/>
            Para creadores holísticos
          </motion.div>

          <motion.h1
            className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight mb-8 text-foreground leading-[1.05]"
            variants={itemVariants}
          >
            Vende cursos, sesiones y comunidad{' '}
            <span
              className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-backgroundShine bg-[200%_auto]"
            >
              sin pelearte con la infraestructura.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed"
            variants={itemVariants}
          >
            Una plataforma todo-en-uno para terapeutas, coaches y creadores del bienestar.{' '}
            <span className="text-foreground/85">Tú pones la sabiduría — nosotros la tecnología, los pagos, la IA y la cabeza fría.</span>
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
            variants={itemVariants}
          >
            <Button
              size="lg"
              asChild
              className="rounded-full px-8 h-12 text-base shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Link href="/signup?role=creator">
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-full px-8 h-12 text-base border-border hover:bg-secondary/40 transition-all duration-300"
            >
              <Link href="/pricing">
                Ver precios
              </Link>
            </Button>
          </motion.div>

          {/* Subtle reassurance row */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            variants={itemVariants}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              Sin tarjeta para empezar
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              Stripe + IA integrados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-primary" />
              GDPR · datos en UE
            </span>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Courses Section */}
      <motion.section
        id="courses-featured"
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
                <motion.div key={i} variants={itemVariants} className="flex">
                  <Card className="flex flex-col overflow-hidden shadow-lg rounded-lg bg-card w-full">
                    <Skeleton className="aspect-[16/9] w-full" />
                    <CardContent className="flex-grow p-5 space-y-3">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                    <CardFooter className="p-5 border-t bg-secondary/30 flex justify-between items-center">
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-9 w-1/3" />
                    </CardFooter>
                  </Card>
                </motion.div>
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
              <Zap size={48} className="mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Sé el Primero en Compartir Tu Conocimiento!</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Aún no tenemos cursos destacados. ¿Tienes una habilidad o pasión que enseñar? <br/>Conviértete en uno de nuestros Creators fundadores.</p>
              <Button size="lg" asChild className="rounded-full">
                <Link href="/signup?role=creator">Conviértete en Creator <ArrowRight className="ml-2 h-5 w-5" /></Link>
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

      {/* Pricing Teaser Section — full page lives at /pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="text-center mb-12 max-w-2xl mx-auto"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="text-xs font-medium tracking-wider uppercase text-brand-terracotta mb-3">
              Precios
            </p>
            <h2 className="font-headline text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-foreground">
              Empieza gratis. Crece a tu ritmo.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Tres planes pensados para acompañarte desde el primer curso hasta una práctica con varios coaches y miles de estudiantes.
            </p>
          </motion.div>

          {/* 3 tier teasers — link to /pricing for full details */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {/* Free */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Empieza</CardTitle>
                  <p className="text-3xl font-semibold mt-2 text-foreground">€0<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80 space-y-1.5">
                  <p>1 producto activo</p>
                  <p>Hasta 50 estudiantes</p>
                  <p>500 créditos AI / mes</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro — highlighted */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all h-full border-brand-terracotta/40 border-2 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-terracotta text-white text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
                  Más elegida
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-brand-terracotta">Pro</CardTitle>
                  <p className="text-3xl font-semibold mt-2 text-foreground">€9<span className="text-sm font-normal text-muted-foreground">/mes</span></p>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80 space-y-1.5">
                  <p>Productos ilimitados</p>
                  <p>Estudiantes ilimitados</p>
                  <p>5000 créditos AI / mes</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enterprise */}
            <motion.div variants={itemVariants}>
              <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">Enterprise</CardTitle>
                  <p className="text-3xl font-semibold mt-2 text-foreground">A medida</p>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80 space-y-1.5">
                  <p>White-label + DPA firmado</p>
                  <p>Región EU dedicada</p>
                  <p>SLA y account manager</p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center mt-10"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
          >
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-full px-8 h-12 text-base border-border hover:bg-secondary/40"
            >
              <Link href="/pricing">
                Ver detalles completos · FAQ · top-ups
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Detailed Become a Creator CTA Section - Permanent */}
      <motion.section
          id="become-creator"
          className="py-16 md:py-24 bg-primary/5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
              >
                <Zap size={48} className="mx-auto text-primary mb-6" />
                <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                  Transforma Tu Pasión en Ingresos como Creator en Consciousness Class
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                  ¿Eres experto en un tema? ¿Te apasiona enseñar? Consciousness Class te da las herramientas y la plataforma
                  para crear cursos online impactantes, conectar con estudiantes y monetizar tu conocimiento.
                </p>
              </motion.div>
            </div>

            <motion.div
              className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 mb-12"
              variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            >
              {creatorBenefitsDetailed.map((benefit) => (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  className="flex items-start gap-4 p-6 bg-card rounded-xl shadow-soft-xl hover:shadow-soft-2xl transition-shadow duration-300"
                >
                  <div className="p-3 bg-primary/10 rounded-full">
                    <benefit.icon className="h-6 w-6 text-primary" data-ai-hint={benefit.dataAiHint}/>
                  </div>
                  <div>
                    <h3 className="text-lg font-headline font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              className="text-center"
              variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
            >
              <Button size="lg" asChild className="rounded-full px-10 py-7 text-lg shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/signup?role=creator">
                  Comienza a Crear Hoy
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
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
            Descubre lo que <span className="text-primary">Consciousness Class</span> Te Ofrece
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
            Experiencias reales de personas que están transformando sus vidas con Consciousness Class.
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

      {/* FAQ Section */}
      <motion.section
        id="faq"
        className="py-16 md:py-24 bg-background"
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
            Preguntas Frecuentes
          </motion.h2>
          <motion.p
            className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-12"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Encuentra respuestas rápidas a las dudas más comunes sobre Consciousness Class.
          </motion.p>
          <motion.div
            className="max-w-3xl mx-auto"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
          >
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqItems.map((item, index) => (
                <AccordionItem value={item.id} key={item.id} className="bg-card rounded-lg shadow-soft-xl overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 text-md font-headline hover:no-underline hover:bg-secondary/50 transition-colors text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-0 text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </motion.section>



       {/* Final CTA Section */}
      <motion.section
        className="py-20 md:py-32 bg-gradient-to-br from-primary/90 to-blue-500/90 text-primary-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container mx-auto px-4 md:px-6 text-center relative">
           <div
            className="absolute inset-0 flex items-center justify-center -z-10 opacity-20 overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div className="spinning-loader w-[300px] h-[300px] md:w-[450px] md:h-[450px]" data-ai-hint="growth spiral modern"></div>
          </div>
          <motion.h2
            className="font-headline text-5xl md:text-5xl font-bold mb-6" 
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            ¿Listo para Iniciar tu Viaje de Aprendizaje?
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl max-w-xl mx-auto mb-10 opacity-90"
            variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }}
          >
            Únete a miles de estudiantes y creators que están alcanzando sus metas con Consciousness Class.
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
              <Button size="lg" variant="outline" asChild className="bg-transparent rounded-full px-8 py-6 text-base border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105">
                <Link href="/courses">Explorar Cursos</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
