'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Layers, Rocket, ShieldCheck, GitBranch, Clock, Terminal, FileCog } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const architecturePrinciples = [
    {
        icon: Layers,
        title: "Arquitectura Hexagonal",
        description: "Aislamiento del dominio del negocio de la infraestructura y la UI para garantizar un núcleo sólido, desacoplado y fácil de expandir."
    },
    {
        icon: Rocket,
        title: "Desarrollo Iterativo",
        description: "Entrega de valor en ciclos cortos y manejables, permitiendo una adaptación y mejora continua."
    },
    {
        icon: ShieldCheck,
        title: "Seguridad por Diseño",
        description: "Implementación de reglas robustas en Firebase y validaciones a nivel de API para proteger datos."
    },
    {
        icon: GitBranch,
        title: "Colaboración Humano-IA",
        description: "Combinamos la estrategia humana con la velocidad de implementación de la IA para acelerar el desarrollo."
    },
    {
        icon: Clock,
        title: "Estimación de Tiempo Flexible",
        description: "Alineación de recursos de lunes a viernes para garantizar un avance constante y mantenido."
    }
];

const roadmapData = [
  {
    phase: "Fase 1: Cimientos de Monetización y Creador",
    description: "Establece las bases económicas de la plataforma y mejora la herramienta principal para los creadores. Es la fase más compleja por la integración de pagos y la lógica de negocio asociada.",
    duration: "2-3 Semanas",
    status: "Pendiente",
    milestones: [
      {
        title: "Hito 1.1: Integración de Pagos con Stripe Connect",
        tasks: [
          { type: 'dev', text: "Backend: Configurar webhooks para `checkout.session.completed` y `invoice.payment_succeeded`." },
          { type: 'user', text: "Configuración Manual (Stripe): Activar Stripe Connect, configurar el tipo de cuenta (Express) y el branding de la plataforma." },
          { type: 'dev', text: "Onboarding del Creator: Desarrollar el flujo para que los creadores conecten su cuenta de Stripe." },
          { type: 'dev', text: "Lógica de Pagos y Comisiones: Implementar `destination_charges` y retener la comisión (`application_fee_amount`)." },
          { type: 'dev', text: "Infraestructura: Crear la entidad `ComisionRegistrada` en Firestore." },
        ]
      },
      {
        title: "Hito 1.2: Expansión del Sistema de Referidos",
        tasks: [
          { type: 'dev', text: "Backend: Modificar la lógica del webhook de Stripe para soportar un sistema de referidos de 2 niveles." },
          { type: 'dev', text: "Interfaz: Crear una sección en el dashboard para visualizar red de referidos."},
          { type: 'user', text: "Definición de Negocio: Establecer los porcentajes de comisión." },
        ]
      },
      {
        title: "Hito 1.3: Mejoras al Formulario de Cursos",
        tasks: [
          { type: 'dev', text: "Categorías Dinámicas: Permitir a los usuarios crear nuevas categorías desde el formulario." },
          { type: 'dev', text: "Tipos de Contenido: Añadir soporte para enlaces de YouTube renderizando iframe." },
        ]
      },
    ]
  },
  {
    phase: "Fase 2: Experiencia de Usuario y Estabilidad",
    description: "Con la monetización en marcha, nos centramos en pulir la experiencia del usuario, corregir errores evidentes y fortalecer la administración de la plataforma.",
    duration: "1.5 Semanas",
    status: "Pendiente",
    milestones: [
        {
            title: "Hito 2.1: Refinamiento de la Interfaz y UX",
            tasks: [
                { type: 'dev', text: "Mejorar UI del Creator: Rediseño enfocado en usabilidad minimalista." },
                { type: 'dev', text: "Mejoras Responsive: Auditoría y corrección en móviles." },
                { type: 'dev', text: "Interacciones: Implementar animaciones sutiles (60fps)." },
            ]
        },
        {
            title: "Hito 2.2: Transición a Custom Claims para Roles",
            tasks: [
                { type: 'dev', text: "Seguridad: Implementar script/API con Admin SDK para sincronizar roles de Firestore hacia Custom Claims de Firebase Auth." },
                { type: 'dev', text: "Backend: Actualizar Reglas de Seguridad en base a `request.auth.token.role` en lugar de getters a documentos." },
                { type: 'dev', text: "Frontend: Refactorizar `AuthContext.tsx` para leer `user.getIdTokenResult()` y eliminar la lectura redundante a la base de datos." },
            ]
        }
    ]
  },
  {
    phase: "Fase 3: Innovación AI",
    description: "Enriquecer la plataforma con características avanzadas e inteligencia artificial.",
    duration: "2-3 Semanas",
    status: "Pendiente",
    milestones: [
        {
            title: "Hito 3.1: Implementación de Agentes IA (MVP)",
            tasks: [
                { type: 'dev', text: "Agente para Creadores: Flow de Genkit para generar ideas de cursos." },
                { type: 'user', text: "Configuración Manual: Habilitar API de Gemini en Google Cloud." },
            ]
        },
        {
            title: "Hito 3.2: Rediseño de Vista de Cursos",
            tasks: [
                { type: 'dev', text: "Investigación y Diseño: Balance LMS vs Red Social." },
                { type: 'dev', text: "Implementación: Diseño minimalista de contenido." },
            ]
        }
    ]
  }
];

const TaskIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'dev': return <Terminal className="h-5 w-5 text-primary" />;
    case 'user': return <FileCog className="h-5 w-5 text-secondary-foreground" />;
    case 'completed': return <Check className="h-5 w-5 text-green-500" />;
    default: return null;
  }
};

const TaskLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-md mb-xl text-caption text-secondary-foreground">
        <div className="flex items-center gap-xs"><Terminal className="h-4 w-4 text-primary" /> Sistema Inteligente</div>
        <div className="flex items-center gap-xs"><FileCog className="h-4 w-4 text-secondary-foreground" /> Configuración Humana</div>
        <div className="flex items-center gap-xs"><Check className="h-4 w-4 text-green-500" /> Completado</div>
    </div>
);

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary overflow-hidden subpixel-antialiased">
      <div className="container mx-auto max-w-[680px] py-2xl px-md md:px-0">
        
        <motion.header 
          className="text-center mb-2xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-hero font-semibold tracking-tight text-foreground mb-sm">Hoja de Ruta</h1>
          <p className="text-body-apple text-secondary-foreground max-w-lg mx-auto leading-relaxed">
            Nuestro plan de evolución iterativa hacia una plataforma de e-learning excepcionalmente cuidada.
          </p>
        </motion.header>

        <TaskLegend />

        <motion.div 
            className="mb-2xl pt-lg"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
             <h2 className="text-title text-center text-foreground font-semibold mb-xl">
                 Principios Fundamentales
             </h2>
            <div className="grid md:grid-cols-2 gap-md">
                {architecturePrinciples.map(principle => (
                    <motion.div key={principle.title} variants={itemVariants}>
                        <div className="apple-card h-full p-lg flex flex-col items-start gap-sm transition-all duration-300 hover:shadow-apple hover:scale-[1.01]">
                            <div className="p-xs bg-secondary rounded-full inline-flex mb-xs">
                                <principle.icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-[17px] tracking-tight">{principle.title}</h3>
                            <p className="text-caption text-secondary-foreground leading-relaxed">{principle.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>

        <div className="relative pt-xl">
          <div className="absolute left-6 md:left-8 top-10 bottom-0 w-[1px] bg-border transition-colors duration-300"></div>
          
          {roadmapData.map((phaseData, phaseIndex) => (
            <motion.div 
              key={phaseData.phase} 
              className="mb-2xl relative pl-20 md:pl-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              
              <div className="absolute left-0 md:left-2 top-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm border border-black/5 ${phaseData.status === 'Completada' ? 'bg-green-50' : 'bg-primary/10'}`}>
                      <span className={`font-semibold text-lg ${phaseData.status === 'Completada' ? 'text-green-600' : 'text-primary'}`}>{phaseIndex + 1}</span>
                  </div>
              </div>

              <div className="mb-lg">
                  <Badge variant="outline" className={`font-medium mb-sm text-[12px] bg-secondary border-none text-secondary-foreground`}>
                      {phaseData.duration}
                  </Badge>
                  <h2 className="text-title text-foreground mb-xs tracking-tight">{phaseData.phase}</h2>
                  <p className="text-body-apple text-secondary-foreground leading-relaxed max-w-xl">{phaseData.description}</p>
              </div>

              <div className="space-y-xl">
              {phaseData.milestones.map((milestone, milestoneIndex) => (
                <div key={milestone.title} className="relative">
                  <h3 className="font-semibold text-[19px] tracking-tight text-foreground mb-md">
                      <span className="text-secondary-foreground mr-2 font-normal">{phaseIndex+1}.{milestoneIndex+1}</span>
                      {milestone.title}
                  </h3>
                  <div className="space-y-sm">
                    {milestone.tasks.map((task, taskIndex) => (
                      <motion.div 
                        key={taskIndex}
                        className="flex items-start gap-md p-md bg-white/50 dark:bg-white/5 rounded-2xl border border-border/50 shadow-sm"
                        variants={itemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                      >
                        <div className="pt-1">
                            <TaskIcon type={task.type} />
                        </div>
                        <p className="text-[15px] text-foreground/90 leading-relaxed flex-1 font-normal">
                            {task.text.split(':').length > 1 ? (
                                <>
                                    <span className="font-medium text-foreground mr-1">{task.text.split(':')[0]}:</span>
                                    <span className="text-secondary-foreground">{task.text.split(':')[1]}</span>
                                </>
                            ) : <span className="text-secondary-foreground">{task.text}</span> }
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
