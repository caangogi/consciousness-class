import React from 'react';
import Image from 'next/image';
import { UploadCloud, ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Create a native input instead of relying on ui/input to avoid unneeded styling conflicts
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';
import { cn } from '@/lib/utils';

interface CourseCoverManagerProps {
  courseId: string;
  courseContext: string;
  previewUrl: string | null;
  fileName?: string;
  isUploading: boolean;
  disabled: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAiSuccess: (url: string) => void;
}

export function CourseCoverManager({
  courseId,
  courseContext,
  previewUrl,
  fileName,
  isUploading,
  disabled,
  onFileSelect,
  onAiSuccess
}: CourseCoverManagerProps) {
  return (
    <div className="ios-list-item flex-col items-start !items-stretch py-4 overflow-visible relative">
      <div className="flex items-center gap-2 mb-4">
         <ImageIcon className="h-5 w-5 text-brand-chambray" />
         <h4 className="font-semibold text-sm">Imagen de Portada</h4>
      </div>

      <div className="relative w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden border border-border/50 group bg-secondary/10 transition-all duration-500 shadow-sm">
        
        {/* Background Image Rendering */}
        {previewUrl ? (
          <Image 
            src={previewUrl} 
            alt="Portada" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
              <ImageIcon className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">Ninguna portada seleccionada</p>
              <p className="text-xs opacity-60">1200x675 px recomendados</p>
           </div>
        )}

        {/* Hover Overlay / Action Center */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-300",
          previewUrl 
            ? "opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-sm" 
            : "opacity-100 hover:bg-secondary/20"
        )}>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-4">
              
              {/* Manual Upload Button disguised as Input container */}
              <div className="relative flex-1">
                 <input 
                   id="coverImageManager" 
                   type="file" 
                   accept="image/png, image/jpeg, image/webp, image/gif" 
                   onChange={onFileSelect} 
                   className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" 
                   disabled={disabled || isUploading} 
                 />
                 <Button 
                   type="button" 
                   variant={previewUrl ? 'secondary' : 'outline'} 
                   className={cn(
                     "w-full pointer-events-none relative shadow-sm h-11",
                     previewUrl ? "bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20 backdrop-blur-md" : "bg-background border-border"
                   )}
                 >
                   {isUploading ? <UploadCloud className="mr-2 h-4 w-4 text-brand-chambray animate-pulse" /> : <UploadCloud className="mr-2 h-4 w-4 text-brand-chambray" />}
                   {isUploading ? 'Subiendo...' : (fileName ? (fileName.length > 15 ? fileName.substring(0,12) + '...' : fileName) : 'Elegir Imagen')}
                 </Button>
              </div>

              {/* AI Generation MiniStudio */}
              <div className="flex-1 relative z-20">
                <MiniStudioDialog 
                  currentTitle={courseContext}
                  onSuccess={onAiSuccess}
                  triggerButton={
                    <Button 
                      variant={previewUrl ? 'default' : 'secondary'} 
                      type="button" 
                      className={cn(
                        "w-full flex gap-2 items-center text-sm font-medium transition-all shadow-sm h-11",
                        !previewUrl && "border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                      )}
                    >
                      <Sparkles className="h-4 w-4" /> Magia con IA
                    </Button>
                  }
                />
              </div>

           </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground px-1">Sube una imagen atractiva o usa Nano Banana para generarla automáticamente. Formatos recomendados: 16:9, máx 5MB.</p>
    </div>
  );
}
