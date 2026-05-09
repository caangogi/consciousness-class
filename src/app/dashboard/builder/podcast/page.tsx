'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, Mic, Rss } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';

export default function PodcastBuilderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [rssFeedUrl, setRssFeedUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Falta título', description: 'Tu podcast necesita un nombre.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/podcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ title, shortDescription: description, price: Number(price), rssFeedUrl: rssFeedUrl || undefined, coverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Podcast creado', description: 'Tu podcast aparece en el catálogo.' });
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
          <h1 className="text-largeTitle font-bold text-foreground">Nuevo Podcast</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="ios-button rounded-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Publicar Podcast
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5 text-brand-terracotta" /> Información del Podcast
              </CardTitle>
              <CardDescription>Configura tu canal de audio exclusivo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Nombre del Podcast</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Ej. Conversaciones desde el Alma" />
              </div>
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full min-h-[100px] p-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="De qué trata tu podcast. Qué aprenderán tus oyentes..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-subheadline font-medium">Precio de acceso (€)</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="0 = Libre" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold flex items-center gap-2">
                <Rss className="w-5 h-5 text-orange-500" /> RSS Feed (opcional)
              </CardTitle>
              <CardDescription>Si ya tienes un podcast en Spotify/Apple, pega tu RSS aquí para sincronizar los episodios.</CardDescription>
            </CardHeader>
            <CardContent>
              <input value={rssFeedUrl} onChange={e => setRssFeedUrl(e.target.value)} type="url" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="https://anchor.fm/s/.../podcast/rss" />
              <p className="text-xs text-muted-foreground mt-2">Próximamente: Auto-transcripción con Whisper y generación de Show Notes con IA.</p>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="shadow-sm border-border/50 sticky top-24">
            <CardHeader><CardTitle className="text-title3 font-semibold">Portada (Artwork)</CardTitle></CardHeader>
            <CardContent>
              <div className="relative rounded-[18px] aspect-square overflow-hidden border-2 border-dashed border-border bg-secondary/10 flex flex-col items-center justify-center">
                {coverUrl && <img src={coverUrl} alt="cover" className="w-full h-full object-cover absolute inset-0" />}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 transition-all ${coverUrl ? 'opacity-0 hover:opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-100'}`}>
                  {!coverUrl && <><UploadCloud className="w-8 h-8 text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">Formato cuadrado recomendado para podcasts</p></>}
                  <MiniStudioDialog currentTitle={title || 'Podcast Premium'} onSuccess={(url) => { setCoverUrl(url); }} triggerButton={
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
