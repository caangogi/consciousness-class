'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, Clock, Link2, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';

export default function CoachingBuilderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('97');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [meetingLink, setMeetingLink] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!specialty.trim()) {
      toast({ title: 'Describe tu especialidad', description: 'Escribe en qué eres experto para que la IA te ayude.', variant: 'destructive' });
      return;
    }
    setIsGeneratingPlan(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/downloads/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: `Genera 3 propuestas de plan de sesión de coaching de ${durationMinutes} minutos para un experto en: ${specialty}. Incluye estructura de la sesión, preguntas clave y resultados esperados.` })
      });
      const data = await res.json();
      if (res.ok) { setGeneratedPlan(data.markdown); }
      else throw new Error(data.error);
    } catch (e: any) {
      toast({ title: 'Error IA', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Falta título', description: 'Ponle un nombre a tu sesión de coaching.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ title, shortDescription: description, price: Number(price), durationMinutes: Number(durationMinutes), meetingLink: meetingLink || undefined, coverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Sesión creada', description: 'Tu servicio de coaching aparece en el catálogo.' });
        router.push('/dashboard/products');
      } else throw new Error(data.error);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="ios-button h-10 w-10 p-0 rounded-full">
            <Link href="/dashboard/products"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-largeTitle font-bold text-foreground">Nueva Sesión de Coaching</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="ios-button rounded-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold">Información del Servicio</CardTitle>
              <CardDescription>Define qué ofreces y a quién va dirigido.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Nombre del Servicio</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Ej. Sesión 1:1 de Integración Emocional" />
              </div>
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="¿Qué sucede durante la sesión? ¿Qué resultados puede esperar el cliente?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-subheadline font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> Duración (min)</label>
                  <input value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <label className="text-subheadline font-medium">Precio (€)</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-subheadline font-medium flex items-center gap-1.5"><Link2 className="w-4 h-4" /> Link de reunión (opcional)</label>
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} type="url" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="https://meet.google.com/..." />
              </div>
            </CardContent>
          </Card>

          {/* AI Session Plan Generator */}
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-brand-chambray/5 to-transparent">
              <CardTitle className="text-title3 font-semibold flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-brand-chambray" /> Generador de Plan de Sesión IA
              </CardTitle>
              <CardDescription>Describe tu especialidad y deja que Nano Banana te proponga 3 estructuras de sesión listas para usar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <textarea value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full min-h-[80px] p-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-chambray resize-y" placeholder="Ej: Psicóloga especializada en trauma y EMDR, trabajo con adultos..." />
              <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="ios-button w-full h-11 bg-brand-chambray/90 hover:bg-brand-chambray text-white">
                {isGeneratingPlan ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGeneratingPlan ? 'Diseñando tu plan...' : 'Generar Plan de Sesión'}
              </Button>
              {generatedPlan && (
                <div className="bg-secondary/30 p-4 rounded-xl text-sm text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto border border-border">
                  {generatedPlan}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="shadow-sm border-border/50 sticky top-24">
            <CardHeader><CardTitle className="text-title3 font-semibold">Portada</CardTitle></CardHeader>
            <CardContent>
              <div className="relative rounded-[18px] aspect-[9/16] overflow-hidden border-2 border-dashed border-border bg-secondary/10 flex flex-col items-center justify-center">
                {coverUrl && <img src={coverUrl} alt="cover" className="w-full h-full object-cover absolute inset-0" />}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 transition-all ${coverUrl ? 'opacity-0 hover:opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-100'}`}>
                  {!coverUrl && <><UploadCloud className="w-8 h-8 text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">Sin portada</p></>}
                  <MiniStudioDialog currentTitle={title || 'Coaching Premium'} onSuccess={setCoverUrl} triggerButton={
                    <Button variant="default" className="w-full ios-button h-10 text-sm"><Sparkles className="w-4 h-4 mr-2" /> Nano Banana</Button>
                  } />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
