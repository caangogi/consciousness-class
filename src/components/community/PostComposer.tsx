'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/config';
import {
  Send, Image as ImageIcon, Video, FileText, Megaphone,
  HelpCircle, ShoppingBag, Film, Globe, Lock, X, Loader2, Sparkles
} from 'lucide-react';
import type { PostType, PostVisibility, Attachment } from '@/backend/community/domain/entities/community-post.entity';

interface AttachmentWithFile extends Attachment {
  _file?: File;
}

interface PostComposerProps {
  communityId: string;
  isCreator: boolean;
  defaultVisibility: 'public' | 'members_only';
  onPostCreated: () => void;
  catalogItems?: { id: string; publicName: string; coverUrl?: string }[];
}

const POST_TYPES: { value: PostType; label: string; icon: React.ElementType; creatorOnly: boolean; description: string }[] = [
  { value: 'text',             label: 'Publicación',     icon: FileText,    creatorOnly: false, description: 'Texto libre, reflexión o diario' },
  { value: 'announcement',     label: 'Anuncio',         icon: Megaphone,   creatorOnly: true,  description: 'Novedad importante para tu comunidad' },
  { value: 'question',         label: 'Pregunta',        icon: HelpCircle,  creatorOnly: false, description: 'Abre un hilo de Q&A' },
  { value: 'free_content',     label: 'Contenido Libre', icon: Sparkles,    creatorOnly: true,  description: 'Lead magnet público para atraer nuevos miembros' },
  { value: 'product_showcase', label: 'Producto',        icon: ShoppingBag, creatorOnly: true,  description: 'Muestra un producto del catálogo' },
  { value: 'momento',          label: 'Momento',         icon: Film,        creatorOnly: false, description: 'Video corto (≤60s) para compartir un instante' },
];

export function PostComposer({ communityId, isCreator, defaultVisibility, onPostCreated, catalogItems }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [visibility, setVisibility] = useState<PostVisibility>(defaultVisibility);
  const [attachments, setAttachments] = useState<AttachmentWithFile[]>([]);
  const [catalogItemRef, setCatalogItemRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const availableTypes = POST_TYPES.filter(t => isCreator || !t.creatorOnly);
  const activeType = POST_TYPES.find(t => t.value === postType)!;
  const ActiveIcon = activeType.icon;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video' | 'momento') => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setAttachments(prev => [...prev, {
        type: mediaType,
        url: previewUrl,
        fileName: file.name,
        thumbnailUrl: mediaType === 'image' ? previewUrl : undefined,
        _file: file,
      } as AttachmentWithFile]);
    });
    e.target.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) return;
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();

      // 1. Upload files to Firebase Storage and get permanent URLs
      const uploadedAttachments: Attachment[] = await Promise.all(
        attachments.map(async (att) => {
          const withFile = att as AttachmentWithFile;
          if (!withFile._file) return att;

          const formData = new FormData();
          formData.append('file', withFile._file);
          formData.append('communityId', communityId);

          const uploadRes = await fetch('/api/community/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!uploadRes.ok) throw new Error(`Error subiendo ${att.fileName}`);
          const data = await uploadRes.json();

          URL.revokeObjectURL(att.url);
          return {
            type: att.type,
            url: data.url,
            fileName: att.fileName,
            thumbnailUrl: att.type === 'image' ? data.url : undefined,
          } as Attachment;
        })
      );

      // 2. Post with permanent URLs
      const res = await fetch(`/api/community/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, postType, visibility, attachments: uploadedAttachments, catalogItemRef }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al publicar');
      }
      setContent('');
      setAttachments([]);
      setCatalogItemRef(null);
      setPostType('text');
      setShowTypeSelector(false);
      onPostCreated();
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[24px] border border-border/50 bg-card overflow-hidden shadow-sm">
      {/* Type selector bar */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowTypeSelector(!showTypeSelector)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-sm font-medium transition-colors"
        >
          <ActiveIcon className="h-3.5 w-3.5" />
          {activeType.label}
        </button>

        <button
          onClick={() => setVisibility(v => v === 'public' ? 'members_only' : 'public')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            visibility === 'public' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          {visibility === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {visibility === 'public' ? 'Público' : 'Solo miembros'}
        </button>
      </div>

      {/* Type dropdown */}
      {showTypeSelector && (
        <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableTypes.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { setPostType(t.value); setShowTypeSelector(false); }}
                className={`flex items-center gap-2 p-3 rounded-2xl text-left text-sm transition-all border ${
                  postType === t.value
                    ? 'border-primary/30 bg-primary/5 shadow-sm'
                    : 'border-border/30 bg-secondary/20 hover:bg-secondary/40'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium text-xs">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Textarea */}
      <div className="px-4">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            postType === 'announcement' ? '📢 Escribe tu anuncio...'
            : postType === 'question' ? '❓ ¿Cuál es tu pregunta?'
            : postType === 'momento' ? '✨ Describe tu momento...'
            : '¿Qué quieres compartir?'
          }
          rows={3}
          className="w-full resize-none bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {attachments.map((att, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border/40 bg-secondary/20">
              {att.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={att.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  {att.type === 'video' || att.type === 'momento' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  <span className="text-[9px] mt-1 truncate max-w-[70px]">{att.fileName}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Catalog item reference */}
      {postType === 'product_showcase' && (
        <div className="px-4 pb-2">
          {catalogItemRef ? (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/20">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium flex-1">
                {catalogItems?.find(i => i.id === catalogItemRef)?.publicName || 'Producto vinculado'}
              </span>
              <button onClick={() => setCatalogItemRef(null)}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCatalogPicker(!showCatalogPicker)}
              className="text-sm text-brand-chambray hover:underline"
            >
              + Vincular un producto del catálogo
            </button>
          )}
          {showCatalogPicker && !catalogItemRef && (
            <div className="mt-2 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {catalogItems?.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCatalogItemRef(item.id); setShowCatalogPicker(false); }}
                  className="text-left p-2 rounded-xl border border-border/30 hover:bg-secondary/40 text-xs"
                >
                  {item.publicName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
        <div className="flex gap-1">
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'image')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => handleFileUpload(e, postType === 'momento' ? 'momento' : 'video')} />

          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
            <ImageIcon className="h-4.5 w-4.5" />
          </button>
          <button onClick={() => videoInputRef.current?.click()} className="p-2 rounded-full hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground">
            <Video className="h-4.5 w-4.5" />
          </button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && attachments.length === 0)}
          size="sm"
          className="rounded-2xl ios-button px-5"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
          Publicar
        </Button>
      </div>
    </div>
  );
}
