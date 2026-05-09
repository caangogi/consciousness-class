'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Save, Sparkles, Check, AlertTriangle, Info, Cpu } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';

interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  supportedMethods: string[];
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
}

interface ModelConfig {
  textModel: string;
  imageModel: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: GeminiModel;
  selected: boolean;
  onSelect: () => void;
}) {
  const isImage = model.name.includes('image');
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
        selected
          ? 'border-brand-chambray bg-brand-chambray/5 ring-1 ring-brand-chambray/40 shadow-sm'
          : 'border-border/50 hover:border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground font-mono">{model.name}</span>
            {isImage && (
              <Badge className="bg-brand-sandstone/10 text-brand-sandstone border-0 text-[10px] h-4 px-1.5">
                🎨 Imagen
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {model.description || model.displayName}
          </p>
          {(model.inputTokenLimit || model.outputTokenLimit) && (
            <div className="flex gap-3 mt-2">
              {model.inputTokenLimit && (
                <span className="text-[10px] text-muted-foreground/70">
                  in: {(model.inputTokenLimit / 1000).toFixed(0)}k
                </span>
              )}
              {model.outputTokenLimit && (
                <span className="text-[10px] text-muted-foreground/70">
                  out: {(model.outputTokenLimit / 1000).toFixed(0)}k
                </span>
              )}
            </div>
          )}
        </div>
        {selected && (
          <div className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-brand-chambray flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export default function AiSettingsPage() {
  const { toast } = useToast();

  const [textModels, setTextModels] = useState<GeminiModel[]>([]);
  const [imageModels, setImageModels] = useState<GeminiModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [currentConfig, setCurrentConfig] = useState<ModelConfig | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const getToken = async () => auth.currentUser?.getIdToken(true);

  const loadCurrentConfig = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrentConfig(data);
      setSelectedText(data.textModel);
      setSelectedImage(data.imageModel);
    } catch (e: any) {
      console.error('Could not load AI config', e);
    }
  }, []);

  const loadModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-models', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTextModels(data.textModels);
      setImageModels(data.imageModels);
    } catch (e: any) {
      setModelsError(e.message);
      toast({ title: 'Error cargando modelos', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoadingModels(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCurrentConfig();
    loadModels();
  }, [loadCurrentConfig, loadModels]);

  useEffect(() => {
    if (!currentConfig) return;
    setIsDirty(
      selectedText !== currentConfig.textModel || selectedImage !== currentConfig.imageModel
    );
  }, [selectedText, selectedImage, currentConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ textModel: selectedText, imageModel: selectedImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCurrentConfig(data);
      setIsDirty(false);
      toast({
        title: '✅ Configuración guardada',
        description: `Los modelos activos se actualizarán en los próximos 30 segundos.`,
      });
      await loadCurrentConfig();
    } catch (e: any) {
      toast({ title: 'Error guardando', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-largeTitle font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-7 w-7 text-brand-chambray" /> Modelos de IA
          </h1>
          <p className="text-secondary-foreground mt-1">
            Selecciona qué modelo de Gemini usa la plataforma para texto e imágenes.
          </p>
        </div>
        <Button
          onClick={loadModels}
          variant="outline"
          className="ios-button rounded-full h-10"
          disabled={isLoadingModels}
        >
          {isLoadingModels ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Actualizar lista</span>
        </Button>
      </div>

      {/* Active config banner */}
      {currentConfig && (
        <div className="rounded-2xl border border-brand-chambray/20 bg-brand-chambray/5 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-brand-chambray shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-foreground mb-0.5">Configuración activa</p>
            <div className="flex flex-wrap gap-3 text-muted-foreground">
              <span>
                Texto:{' '}
                <code className="text-brand-chambray font-mono text-xs bg-brand-chambray/10 px-1.5 py-0.5 rounded">
                  {currentConfig.textModel}
                </code>
              </span>
              <span>
                Imagen:{' '}
                <code className="text-brand-sandstone font-mono text-xs bg-brand-sandstone/10 px-1.5 py-0.5 rounded">
                  {currentConfig.imageModel}
                </code>
              </span>
              {currentConfig.updatedAt && (
                <span className="text-xs opacity-60">
                  Guardado: {new Date(currentConfig.updatedAt).toLocaleString('es-ES')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {modelsError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{modelsError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Models */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-title3 font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-chambray" /> Modelo de Texto
            </CardTitle>
            <CardDescription>
              Generación de contenido, asistente de edición, planes de sesión, normas comunitarias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Cargando modelos desde Gemini API...
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {textModels.map((m) => (
                  <ModelCard
                    key={m.name}
                    model={m}
                    selected={selectedText === m.name}
                    onSelect={() => setSelectedText(m.name)}
                  />
                ))}
                {textModels.length === 0 && !modelsError && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin modelos disponibles.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Models */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-title3 font-semibold flex items-center gap-2">
              🎨 Modelo de Imagen (Nano Banana)
            </CardTitle>
            <CardDescription>
              Generación de portadas Text-to-Image para cursos, membresías y todos los activos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingModels ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Cargando modelos desde Gemini API...
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {imageModels.map((m) => (
                  <ModelCard
                    key={m.name}
                    model={m}
                    selected={selectedImage === m.name}
                    onSelect={() => setSelectedImage(m.name)}
                  />
                ))}
                {imageModels.length === 0 && !modelsError && (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin modelos disponibles.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Bar */}
      <div
        className={`sticky bottom-4 z-30 transition-all duration-300 ${
          isDirty ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <div className="bg-background/95 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Tienes cambios sin guardar. Los modelos se activarán en menos de 30 segundos después de guardar.
          </p>
          <Button onClick={handleSave} disabled={isSaving} className="ios-button rounded-xl shrink-0">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
