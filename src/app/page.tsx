
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, MapPin, MessageSquare, Plus, User, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
  { name: 'Tech Innovators', src: 'https://placehold.co/100x40/cbd5e1/475569?text=Innovate', dataAiHint: 'tech logo' },
  { name: 'Future Learn Co.', src: 'https://placehold.co/100x40/cbd5e1/475569?text=FutureLearn', dataAiHint: 'education logo' },
  { name: 'Synergy Solutions', src: 'https://placehold.co/100x40/cbd5e1/475569?text=Synergy', dataAiHint: 'solutions logo' },
  { name: 'Global Education', src: 'https://placehold.co/100x40/cbd5e1/475569?text=GlobalEdu', dataAiHint: 'global logo' },
  { name: 'NextGen Skills', src: 'https://placehold.co/100x40/cbd5e1/475569?text=NextGen', dataAiHint: 'skills logo' },
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
        {/* Background elements - using placeholders and simple shapes */}
        <motion.div 
          className="absolute top-1/4 left-[10%] md:left-[15%] text-slate-200"
          variants={floatingItemVariants(0.1)}
          initial="initial"
          animate="animate"
        >
          <Image src="https://placehold.co/120x120/e0e7ff/a5b4fc.png?text=+" alt="Abstract Plus" width={100} height={100} data-ai-hint="abstract 3D plus" className="opacity-70" />
        </motion.div>

        <motion.div 
          className="absolute bottom-[15%] left-[5%] md:left-[10%]"
          variants={floatingItemVariants(0.3)}
          initial="initial"
          animate="animate"
        >
          <Image src="https://placehold.co/150x150/e0e7ff/a5b4fc.png?text=Pin" alt="Abstract Location Pin" width={130} height={130} data-ai-hint="3D location pin" className="opacity-70" />
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
          <Image src="https://placehold.co/250x250/e0e7ff/a5b4fc.png?text=👍" alt="Abstract Thumbs Up" width={250} height={250} data-ai-hint="3D thumbs up" className="opacity-60" />
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

      {/* Partner Logos Section */}
      <section className="py-12 md:py-16 bg-secondary/30">
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

      {/* Why Choose Us Section (Simplified) - To be expanded or replaced by Courses Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-4">Comienza tu Viaje de Aprendizaje</h2>
          <p className="text-center text-lg text-muted-foreground max-w-xl mx-auto mb-12">
            MentorBloom te ofrece las herramientas y la comunidad para crecer personal y profesionalmente.
          </p>
           <div className="text-center">
             <Button size="lg" asChild className="rounded-full px-10 py-7 text-lg shadow-soft-xl hover:shadow-soft-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-accent to-orange-400 hover:from-accent/90 hover:to-orange-500 text-accent-foreground">
                <Link href="/courses">Ver Cursos Populares</Link>
              </Button>
           </div>
        </div>
      </section>
    </div>
  );
}
