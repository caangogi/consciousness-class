'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, UploadCloud, ImageIcon, Settings2, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { auth } from '@/lib/firebase/config';
import Image from 'next/image';

interface MiniStudioDialogProps {
  currentTitle?: string;
  onSuccess: (url: string) => void;
  triggerButton?: React.ReactNode;
}

export function MiniStudioDialog({ currentTitle, onSuccess, triggerButton }: MiniStudioDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "3:4" | "1:1" | "16:9" | "4:5">('9:16');
  const [style, setStyle] = useState('Fotorealismo cinemático');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPreview(null);
    try {
      const user = auth.currentUser;
      const idToken = await user?.getIdToken();
      
      const response = await fetch(`/api/creator/assets/ai-cover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          prompt,
          currentTitle,
          aspectRatio,
          style,
          referenceImage
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar la imagen');
      }

      const data = await response.json();
      if (data.url) {
        setGeneratedPreview(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedPreview) {
      onSuccess(generatedPreview);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : (
          <Button variant="secondary" type="button" className="w-full flex gap-2 items-center text-sm font-medium border border-brand-chambray/30 bg-brand-chambray/5 hover:bg-brand-chambray/10 text-brand-chambray transition-all">
            <Sparkles className="h-4 w-4 text-brand-terracotta" /> Generar con IA (Nano Banana)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Mini Studio IA
          </DialogTitle>
          <DialogDescription>
            Diseña una portada profesional en segundos usando Gemini 3 (Nano Banana).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>Instrucción Principal (Prompt)</Label>
            <Textarea 
              placeholder="Ej. Fotografía minimalista de un loto brillante sobre agua oscura..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none h-20 text-sm"
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proporción</Label>
              <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">Vertical 9:16 (Móvil)</SelectItem>
                  <SelectItem value="3:4">Vertical 3:4 (Libro)</SelectItem>
                  <SelectItem value="1:1">Cuadrado 1:1</SelectItem>
                  <SelectItem value="16:9">Panorámico 16:9</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Estilo Artístico</Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fotorealismo cinemático">Fotorealismo Cinemático</SelectItem>
                  <SelectItem value="Ilustración 3D de alta calidad, render octane">Ilustración 3D</SelectItem>
                  <SelectItem value="Minimalista y elegante, flat design">Minimalista Flat</SelectItem>
                  <SelectItem value="Arte conceptual, pintura digital premium">Arte Conceptual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              <span>Image-to-Image (Opcional)</span>
              {referenceImage && (
                <button type="button" onClick={() => setReferenceImage(null)} className="text-xs text-destructive hover:underline">
                  Quitar
                </button>
              )}
            </Label>
            
            {referenceImage ? (
              <div className="relative aspect-video rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                 <Image src={referenceImage} alt="Referencia" fill className="object-contain" />
              </div>
            ) : (
              <div className="relative border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-secondary/20 transition-colors">
                <Input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={isGenerating} />
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Sube un boceto, logo o foto base para que la IA la rediseñe.</p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}
          
          {generatedPreview && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-primary font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-terracotta" /> Portada Generada</Label>
              <div 
                className="relative rounded-md overflow-hidden border bg-muted flex items-center justify-center mx-auto"
                style={{ 
                  aspectRatio: aspectRatio.replace(':', '/'), 
                  maxHeight: '300px',
                  width: aspectRatio === '9:16' || aspectRatio === '3:4' ? 'auto' : '100%',
                  maxWidth: '100%'
                }}
              >
                 <Image src={generatedPreview} alt="AI Generated Cover" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          {!generatedPreview ? (
             <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando arte...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4 text-brand-terracotta" /> Generar Magia
                </>
              )}
            </Button>
          ) : (
             <div className="flex gap-2">
                <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating}>
                  <Wand2 className="mr-2 h-4 w-4" /> Regenerar
                </Button>
                <Button onClick={handleApply} disabled={isGenerating}>
                  Usar esta Imagen
                </Button>
             </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-usando un Input básico integrado
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, type, ...props }, ref) => {
      return (
        <input
          type={type}
          className={className}
          ref={ref}
          {...props}
        />
      )
    }
  )
  Input.displayName = "Input"
