'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, Users, Lock, Globe, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';

export default function CommunityBuilderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingGuidelines, setIsGeneratingGuidelines] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [isPrivate, setIsPrivate] = useState(true);
  const [guidelines, setGuidelines] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const handleGenerateGuidelines = async () => {
    if (!title.trim()) {
      toast({ title: 'Escribe el nombre', description: 'Necesito el nombre de tu comunidad para generar las normas.', variant: 'destructive' });
      return;
    }
    setIsGeneratingGuidelines(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/downloads/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ prompt: `Genera unas reglas de convivencia comunitaria empáticas, cálidas y profesionales para una comunidad llamada "${title}" que trata sobre: ${description || 'bienestar y desarrollo personal'}. Formato: lista de 7-10 reglas con un emoji descriptivo, título y breve explicación.` })
      });
      const data = await res.json();
      if (res.ok) { setGuidelines(data.markdown); }
      else throw new Error(data.error);
    } catch (e: any) {
      toast({ title: 'Error IA', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingGuidelines(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Falta título', description: 'Tu comunidad necesita un nombre.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ title, shortDescription: description, price: Number(price), isPrivate, communityGuidelines: guidelines || undefined, coverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Comunidad creada', description: 'Tu espacio aparece en el catálogo.' });
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
          <h1 className="text-largeTitle font-bold text-foreground">Nueva Comunidad</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="ios-button rounded-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Crear Comunidad
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-chambray" /> Tu Espacio Comunitario
              </CardTitle>
              <CardDescription>Un lugar de transformación colectiva para tus estudiantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Nombre de la Comunidad</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Ej. Círculo de Sanación Interior" />
              </div>
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Descripción y propósito</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="¿Cuál es el propósito de esta comunidad? ¿Qué tipo de personas se unirán?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-subheadline font-medium">Precio de acceso (€)</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="0 = Gratis" />
                </div>
                <div className="space-y-2">
                  <label className="text-subheadline font-medium">Tipo de acceso</label>
                  <div className="flex gap-2 h-11">
                    <button onClick={() => setIsPrivate(true)} className={`flex-1 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${isPrivate ? 'border-brand-chambray bg-brand-chambray/10 text-brand-chambray' : 'border-border text-muted-foreground'}`}>
                      <Lock className="w-3.5 h-3.5" /> Privada
                    </button>
                    <button onClick={() => setIsPrivate(false)} className={`flex-1 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${!isPrivate ? 'border-brand-chambray bg-brand-chambray/10 text-brand-chambray' : 'border-border text-muted-foreground'}`}>
                      <Globe className="w-3.5 h-3.5" /> Pública
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Guidelines Generator */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="bg-gradient-to-r from-brand-chambray/5 to-transparent">
              <CardTitle className="text-title3 font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-brand-chambray" /> Generador de Normas Comunitarias IA
              </CardTitle>
              <CardDescription>Deja que Nano Banana redacte unas reglas empáticas y warmth para tu espacio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Button onClick={handleGenerateGuidelines} disabled={isGeneratingGuidelines} className="ios-button w-full h-11 bg-brand-chambray/90 hover:bg-brand-chambray text-white">
                {isGeneratingGuidelines ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isGeneratingGuidelines ? 'Generando normas...' : 'Generar Normas con IA'}
              </Button>
              <textarea
                value={guidelines}
                onChange={e => setGuidelines(e.target.value)}
                className="w-full min-h-[160px] p-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y text-sm"
                placeholder="Las normas generadas por la IA aparecerán aquí, o puedes escribirlas manualmente..."
              />
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
                  <MiniStudioDialog currentTitle={title || 'Comunidad Holística'} onSuccess={setCoverUrl} triggerButton={
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
