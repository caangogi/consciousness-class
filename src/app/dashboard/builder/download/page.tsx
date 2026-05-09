'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';
import { AssistiveMarkdownEditor } from '@/components/dashboard/shared/AssistiveMarkdownEditor';

export default function DownloadBuilderPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('info');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [prompt, setPrompt] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  
  // AI Result State
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);

  const handleGenerateMagicDocument = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Falta información', description: 'Escribe de qué tratará el documento.', variant: 'destructive' });
      return;
    }
    
    setIsGenerating(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/downloads/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (res.ok) {
        setGeneratedMarkdown(data.markdown);
        toast({ title: '¡Magia completada!', description: 'El documento ha sido generado con éxito.' });
      } else {
        throw new Error(data.error || 'Error al generar');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setActiveTab('info');
      toast({ title: 'Falta título', description: 'Debes darle un nombre a tu descarga.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      // Here usually you upload the File/Markdown to Storage first to get fileUrl
      // Mocking the fileUrl for this POC since we just save the AI draft
      const mockFileUrl = "https://example.com/generated-draft.pdf";
      
      const payload = {
        title,
        shortDescription: description,
        price: Number(price),
        fileUrl: mockFileUrl,
        fileSizeKB: generatedMarkdown ? Math.round(generatedMarkdown.length / 1024) : 0,
      };

      const res = await fetch('/api/creator/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Guardado', description: 'Tu descarga digital ha sido guardada en el catálogo.' });
        router.push('/dashboard/products');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-1">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="ios-button h-10 w-10 p-0 rounded-full">
            <Link href="/dashboard/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-largeTitle font-bold text-foreground">Nueva Descarga Digital</h1>
        </div>
        <Button onClick={handleSaveDraft} disabled={isSaving} className="ios-button rounded-full">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Guardar Proyecto
        </Button>
      </div>

      <div className="flex bg-secondary/30 p-1 rounded-2xl w-fit mb-8">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2.5 rounded-xl text-subheadline font-medium transition-all ${
            activeTab === 'info' ? 'bg-background shadow-apple text-foreground' : 'text-secondary-foreground hover:text-foreground'
          }`}
        >
          1. Información
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`px-6 py-2.5 rounded-xl text-subheadline font-medium transition-all ${
            activeTab === 'content' ? 'bg-background shadow-apple text-foreground' : 'text-secondary-foreground hover:text-foreground'
          }`}
        >
          2. Archivo / Contenido
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {activeTab === 'info' && (
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-title3 font-semibold">Detalles del Producto</CardTitle>
                <CardDescription>Define cómo verán tus clientes esta descarga.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-subheadline font-medium text-foreground">Título</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Ej. Guía de Meditación para Principiantes" />
                </div>
                <div className="space-y-2">
                  <label className="text-subheadline font-medium text-foreground">Descripción</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full min-h-[120px] p-4 rounded-xl border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="Explica qué incluye esta descarga y a quién va dirigida..." />
                </div>
                <div className="space-y-2">
                  <label className="text-subheadline font-medium text-foreground">Precio (€)</label>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="0 para gratuito" />
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'content' && (
            <Card className="shadow-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-title3 font-semibold">Generar o Subir Archivo</CardTitle>
                <CardDescription>Puedes subir tu propio PDF o dejar que la IA genere un Lead Magnet para ti.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {generatedMarkdown ? (
                  <div className="border border-green-500/30 bg-green-500/10 rounded-[20px] p-6 space-y-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                      <span>Documento IA Generado Exitosamente</span>
                    </div>
                    {/* The new Magic Editor that replaces the static box */}
                    <AssistiveMarkdownEditor 
                        initialContent={generatedMarkdown} 
                        onChange={(val) => setGeneratedMarkdown(val)} 
                    />
                    <Button onClick={() => setGeneratedMarkdown(null)} variant="outline" className="ios-button mt-4 border-destructive text-destructive hover:bg-destructive/10">
                      Descartar Documento
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 rounded-[20px] bg-gradient-to-br from-brand-sandstone/10 to-transparent border border-brand-sandstone/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Sparkles className="w-24 h-24 text-brand-sandstone" />
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-brand-sandstone/20 rounded-xl">
                        <Sparkles className="w-6 h-6 text-brand-sandstone" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-headline">Autogenerar con IA</h3>
                        <p className="text-caption1 text-secondary-foreground">Ideal para Lead Magnets rápidos</p>
                      </div>
                    </div>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full min-h-[100px] p-4 rounded-xl border border-brand-sandstone/30 bg-background/50 backdrop-blur-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-sandstone resize-y mb-4 relative z-10" 
                      placeholder="Escribe de qué quieres que trate el eBook o plantilla... Ej: 'Planificador de hábitos de gratitud de 7 días con explicaciones diarias'"
                    />
                    <Button onClick={handleGenerateMagicDocument} disabled={isGenerating} className="ios-button w-full bg-brand-sandstone hover:text-white text-white hover:bg-brand-sandstone/90 mb-4 h-11 relative z-10">
                      {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {isGenerating ? 'Escribiendo documento...' : 'Generar Documento Mágico'}
                    </Button>
                  </div>
                )}

                {!generatedMarkdown && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                         <span className="bg-card px-3 text-secondary-foreground text-caption1 font-medium tracking-wide">O sube manualmente</span>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-[20px] p-10 flex flex-col items-center justify-center text-center hover:bg-secondary/5 transition-colors cursor-pointer">
                      <div className="bg-secondary p-4 rounded-full mb-4">
                        <UploadCloud className="w-8 h-8 text-secondary-foreground" />
                      </div>
                      <h4 className="text-headline font-semibold mb-2">Arrastra tu archivo aquí</h4>
                      <p className="text-subheadline text-secondary-foreground mb-6 max-w-sm">
                        Aceptamos formatos PDF, MP3, ZIP y plantillas de Notion que tus estudiantes podrán descargar. (Máx 1GB)
                      </p>
                      <Button variant="outline" className="ios-button">
                        Seleccionar Archivo Local
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-1 space-y-6">
          <Card className="shadow-sm border-border/50 sticky top-24">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold">Portada del Activo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-transparent relative rounded-[18px] aspect-[9/16] overflow-hidden flex flex-col items-center justify-center text-center transition-colors">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 border-2 border-dashed border-border rounded-[18px] bg-secondary/10 flex flex-col items-center justify-center p-4">
                    <UploadCloud className="w-8 h-8 text-secondary-foreground mb-4" />
                    <p className="text-caption1 text-secondary-foreground">Sin portada</p>
                  </div>
                )}
                
                <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/60 backdrop-blur-sm transition-all flex flex-col items-center justify-center gap-2 p-4">
                  <MiniStudioDialog 
                    currentTitle={title || 'Descarga Premium'}
                    onSuccess={(url) => setCoverUrl(url)}
                    triggerButton={
                      <Button variant="default" className="w-full h-11 ios-button">
                        <Sparkles className="w-4 h-4 mr-2" /> Nano Banana Cover
                      </Button>
                    }
                  />
                  <Button variant="outline" className="w-full h-11 bg-white/10 border-white/20 text-white hover:bg-white/20">
                     Subir Manual
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
