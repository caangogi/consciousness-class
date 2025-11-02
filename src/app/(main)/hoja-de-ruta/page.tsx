
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Code, User, Rocket, Layers, ShieldCheck, GitBranch, FileCog, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
    },
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
        description: "Entrega de valor en ciclos cortos y manejables (fases), permitiendo una adaptación y mejora continua."
    },
    {
        icon: ShieldCheck,
        title: "Seguridad por Diseño",
        description: "Implementación de reglas robustas en Firebase y validaciones a nivel de API para proteger los datos y la lógica de negocio."
    },
    {
        icon: GitBranch,
        title: "Colaboración Humano-IA",
        description: "Combinamos la estrategia humana con la velocidad de implementación de la IA para acelerar el desarrollo y mantener una alta calidad de código."
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
          { type: 'dev', text: "Onboarding del Creator: Desarrollar el flujo para que los creadores puedan conectar su cuenta de Stripe a nuestra plataforma." },
          { type: 'dev', text: "Lógica de Pagos y Comisiones: Implementar `destination_charges` en la creación de la sesión de Stripe para transferir el pago al creator y retener la comisión de la plataforma (`application_fee_amount`)." },
          { type: 'dev', text: "Infraestructura: Crear la entidad `ComisionRegistrada` en Firestore para un seguimiento detallado de cada transacción." },
        ]
      },
      {
        title: "Hito 1.2: Expansión del Sistema de Referidos",
        tasks: [
          { type: 'dev', text: "Backend: Modificar la lógica del webhook de Stripe para soportar un sistema de referidos de 2 niveles (requiere análisis previo)." },
          { type: 'dev', text: "Interfaz: Crear una sección en el dashboard del usuario para visualizar su red de referidos y las ganancias generadas."},
          { type: 'user', text: "Definición de Negocio: Establecer los porcentajes de comisión para el primer y segundo nivel de referidos." },
          { type: 'dev', text: "Legal: Implementar la sección de Términos y Condiciones del sistema de referidos, ganancias y liquidaciones." },
        ]
      },
      {
        title: "Hito 1.3: Mejoras al Formulario de Cursos",
        tasks: [
          { type: 'dev', text: "Categorías Dinámicas: Crear la entidad `Categoria` y su repositorio. Permitir a los usuarios crear nuevas categorías desde el formulario." },
          { type: 'dev', text: "Tipos de Contenido: Añadir soporte para enlaces de YouTube en el formulario y renderizar el `iframe` correspondiente en la vista de la lección." },
          { type: 'dev', text: "Corrección de Bug: Solucionar la falla de reactividad al elegir el tipo de contenido, asegurando que los campos correctos se muestren dinámicamente." },
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
                { type: 'dev', text: "Mejorar UI del Creator: Rediseñar la interfaz de creación de cursos para que sea más intuitiva y guiada." },
                { type: 'dev', text: "Mejoras Responsive: Realizar una auditoría y corrección completa del diseño en dispositivos móviles." },
                { type: 'dev', text: "Cierre Automático del Sidebar: Implementar la lógica para que el menú lateral en móvil se cierre al hacer clic en un enlace." },
            ]
        },
        {
            title: "Hito 2.2: Corrección de Enlaces Rotos",
            tasks: [
                { type: 'dev', text: "Identificar todos los enlaces del dashboard que llevan a 404 (ej. /ingresos, /estadisticas)." },
                { type: 'dev', text: "Crear páginas placeholder o deshabilitar los enlaces temporalmente, comunicando que la funcionalidad estará disponible próximamente." },
            ]
        },
        {
            title: "Hito 2.3: Administración de Roles",
            tasks: [
                { type: 'dev', text: "Backend: Revisar y afinar los Custom Claims de Firebase Auth para los roles." },
                { type: 'dev', text: "Documentación: Documentar el uso de roles (`student`, `creator`, `superadmin`) para asegurar un control de acceso coherente." },
            ]
        }
    ]
  },
    {
    phase: "Fase 3: Innovación y Expansión de Características",
    description: "Esta fase se centra en enriquecer la plataforma con características avanzadas, introduciendo la inteligencia artificial y mejorando la interacción del usuario con el contenido.",
    duration: "2-3 Semanas",
    status: "Pendiente",
    milestones: [
        {
            title: "Hito 3.1: Implementación de Agentes IA (MVP)",
            tasks: [
                { type: 'dev', text: "Agente para Creadores: Crear un flow de Genkit que ayude a los creators a generar ideas para cursos y estructurar contenido." },
                { type: 'user', text: "Configuración Manual: Asegurar que la API de Gemini esté habilitada en el proyecto de Google Cloud y las credenciales estén configuradas." },
                { type: 'dev', text: "Análisis de Costos: Investigar la economía de tokens de Genkit/Gemini y definir un sistema básico de 'créditos de IA' para controlar el consumo." },
                { type: 'dev', text: "Agente de Soporte (Prototipo): Diseñar un agente básico de atención al cliente que pueda responder a preguntas frecuentes (FAQs)." },
            ]
        },
        {
            title: "Hito 3.2: Rediseño de la Vista de Cursos",
            tasks: [
                { type: 'dev', text: "Investigación y Diseño: Analizar plataformas líderes para encontrar el equilibrio entre un LMS y una red social." },
                { type: 'dev', text: "Implementación: Refactorizar la página de detalle del curso con un diseño más moderno e intuitivo." },
            ]
        },
        {
            title: "Hito 3.3: Entidad de Banners Dinámicos",
            tasks: [
                { type: 'dev', text: "Diseño de Arquitectura: Definir la entidad `Banner`, su repositorio y los casos de uso bajo una arquitectura hexagonal." },
                { type: 'dev', text: "Implementación: Crear la API y los componentes de UI para gestionar y mostrar banners dinámicos en la plataforma."},
            ]
        }
    ]
  },
  {
    phase: "Fase 4: Consolidación y Crecimiento",
    description: "En la última fase, nos enfocamos en la comunicación con el usuario, la gestión a gran escala y la creación de contenido que explique el valor de la plataforma.",
    duration: "2 Semanas",
    status: "Pendiente",
    milestones: [
        {
            title: "Hito 4.1: Gestión y Comunicación con Usuarios",
            tasks: [
                { type: 'dev', text: "Gestión de Usuarios (Superadmin): Crear la interfaz para que el superadministrador pueda ver, filtrar y gestionar usuarios." },
                { type: 'user', text: "Configuración Manual: Configurar un servicio de envío de emails (ej. SendGrid, Mailgun) y añadir las credenciales al entorno." },
                { type: 'dev', text: "Triggers de Email: Configurar Firebase Functions para enviar correos transaccionales clave (bienvenida, confirmación, etc.)." },
            ]
        },
        {
            title: "Hito 4.2: Contenido Explicativo",
            tasks: [
                { type: 'dev', text: "Crear el apartado público `/como-funciona` para explicar de manera clara y visual el funcionamiento de la plataforma para estudiantes y creadores." },
            ]
        },
        {
            title: "Hito 4.3: Característica de Duración Automática",
            tasks: [
                { type: 'dev', text: "Investigación: Analizar cómo obtener metadatos de duración de archivos de video y audio." },
                { type: 'dev', text: "Implementación: Desarrollar una Firebase Function que calcule la duración total del contenido de un curso y la actualice." },
                { type: 'dev', text: "Añadir el toggle en el UI para que el creator decida si mostrar la duración total." },
            ]
        }
    ]
  }
];

const TaskIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'dev': return <Terminal className="h-5 w-5 text-primary" />;
    case 'user': return <FileCog className="h-5 w-5 text-amber-600" />;
    case 'completed': return <Check className="h-5 w-5 text-green-600" />;
    default: return null;
  }
};

const TaskLegend = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-12 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" /> Tarea de Desarrollo (IA)</div>
        <div className="flex items-center gap-2"><FileCog className="h-5 w-5 text-amber-600" /> Tarea de Configuración (Usuario)</div>
        <div className="flex items-center gap-2"><Check className="h-5 w-5 text-green-600" /> Tarea Completada</div>
    </div>
);

export default function RoadmapPage() {
  return (
    <div className="bg-secondary/30">
      <div className="container mx-auto max-w-5xl py-16 px-4 md:px-6">
        
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">Hoja de Ruta del Desarrollo</h1>
          <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
            Nuestro plan para construir una plataforma de e-learning potente y escalable, impulsada por IA, sobre nuestra arquitectura existente.
          </p>
        </motion.header>

        <TaskLegend />

        <motion.div 
            className="mb-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
             <h2 className="text-2xl md:text-3xl font-bold font-headline text-center mb-8 relative">
                <span className="absolute left-0 top-1/2 w-8 h-0.5 bg-primary hidden sm:block"></span>
                Principios Fundamentales de la Arquitectura
                <span className="absolute right-0 top-1/2 w-8 h-0.5 bg-primary hidden sm:block"></span>
             </h2>
            <div className="grid md:grid-cols-2 gap-6">
                {architecturePrinciples.map(principle => (
                    <motion.div key={principle.title} variants={itemVariants}>
                        <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                                <principle.icon className="h-7 w-7 text-primary" />
                                <CardTitle className="text-lg font-headline">{principle.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{principle.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </motion.div>

        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[35px] top-4 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
          
          {roadmapData.map((phaseData, phaseIndex) => (
            <motion.div 
              key={phaseData.phase} 
              className="mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: phaseIndex * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="relative z-10">
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center ${phaseData.status === 'Completada' ? 'bg-green-600' : 'bg-primary'}`}>
                        <span className="text-white font-bold text-xl">{phaseIndex + 1}</span>
                    </div>
                </div>
                <div className="flex-1 pt-1">
                    <Badge variant={phaseData.status === 'Completada' ? 'default' : 'secondary'} className={phaseData.status === 'Completada' ? 'bg-green-100 text-green-700' : ''}>
                        Duración: {phaseData.duration}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold font-headline mt-1">{phaseData.phase}</h2>
                    <p className="text-muted-foreground mt-1 mb-6">{phaseData.description}</p>
                </div>
              </div>

              {phaseData.milestones.map((milestone, milestoneIndex) => (
                <div key={milestone.title} className="relative pl-8 sm:pl-[76px] mt-6">
                  <div className="absolute left-[1px] top-3 bottom-0 w-0.5 bg-border/70"></div>
                  <div className="absolute left-[1px] top-3 h-3 w-3 rounded-full bg-primary/50 border-2 border-primary -translate-x-[5px]"></div>
                  
                  <h3 className="text-xl font-bold font-headline mb-4">Hito {phaseIndex+1}.{milestoneIndex+1}: {milestone.title}</h3>
                  <div className="space-y-3">
                    {milestone.tasks.map((task, taskIndex) => (
                      <motion.div 
                        key={taskIndex}
                        className="flex items-start gap-3 p-3 bg-card rounded-md border shadow-sm"
                        variants={itemVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 1 }}
                      >
                        <div className="pt-0.5">
                            <TaskIcon type={task.type} />
                        </div>
                        <p className="text-sm text-foreground/90 flex-1">
                            {task.text.split(':').length > 1 ? (
                                <>
                                    <span className="font-semibold text-primary/90">{task.text.split(':')[0]}:</span>
                                    {task.text.split(':')[1]}
                                </>
                            ) : task.text }
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
