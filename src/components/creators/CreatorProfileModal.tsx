'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video } from 'lucide-react';

interface CreatorProfileModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  creator: {
    id: string;
    nombre: string;
    avatarUrl: string;
    dataAiHint?: string;
    bio: string;
    videoUrl: string | null;
  };
}

export function CreatorProfileModal({ isOpen, setIsOpen, creator }: CreatorProfileModalProps) {
  if (!creator) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const renderVideoPlayer = (url: string) => {
    if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com/video')) {
      return (
        <iframe
          src={url}
          width="100%"
          height="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="rounded-md border aspect-video"
          title={`Video de presentación de ${creator.nombre}`}
        ></iframe>
      );
    }
    // Fallback for direct video links
    return <video controls src={url} className="w-full rounded-md aspect-video bg-black"><track kind="captions" /></video>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="text-center items-center">
          <Avatar className="h-24 w-24 mb-4 border-4 border-primary shadow-md">
            <AvatarImage src={creator.avatarUrl} alt={creator.nombre} data-ai-hint={creator.dataAiHint} />
            <AvatarFallback>{getInitials(creator.nombre)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="text-2xl font-headline">{creator.nombre}</DialogTitle>
          <DialogDescription>Instructor en Consciousness Class</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="py-4 space-y-6">
                {creator.videoUrl && (
                    <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2"><Video className="h-5 w-5 text-primary"/> Video de Presentación</h4>
                        {renderVideoPlayer(creator.videoUrl)}
                    </div>
                )}

                <div className="space-y-2">
                     <h4 className="font-semibold">Sobre mí</h4>
                     <p className="text-sm text-muted-foreground whitespace-pre-wrap">{creator.bio}</p>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
