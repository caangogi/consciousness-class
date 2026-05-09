'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Heart, MessageCircle, Globe, Megaphone, Sparkles,
  ShoppingBag, Film, HelpCircle, FileText, Users, ArrowRight
} from 'lucide-react';
import type { PostType } from '@/backend/community/domain/entities/community-post.entity';

const TYPE_BADGE: Record<PostType, { label: string; icon: React.ElementType; className: string }> = {
  text:             { label: 'Publicación',     icon: FileText,    className: 'bg-secondary text-foreground' },
  announcement:     { label: 'Anuncio',         icon: Megaphone,   className: 'bg-blue-500/10 text-blue-600' },
  question:         { label: 'Pregunta',        icon: HelpCircle,  className: 'bg-amber-500/10 text-amber-600' },
  free_content:     { label: 'Contenido Libre', icon: Sparkles,    className: 'bg-green-500/10 text-green-600' },
  product_showcase: { label: 'Producto',        icon: ShoppingBag, className: 'bg-purple-500/10 text-purple-600' },
  momento:          { label: 'Momento',         icon: Film,        className: 'bg-pink-500/10 text-pink-600' },
};

interface FeedPost {
  id: string;
  communityId: string;
  postType: PostType;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  contentSnapshot: string;
  attachments: any[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  community?: { id: string; title: string; coverUrl: string | null };
}

const FILTERS = [
  { value: null, label: 'Todos' },
  { value: 'announcement', label: '📢 Anuncios' },
  { value: 'free_content', label: '✨ Contenido Libre' },
  { value: 'product_showcase', label: '🛍️ Productos' },
  { value: 'momento', label: '🎬 Momentos' },
];

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = async (append = false) => {
    if (append) setLoadingMore(true); else setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('type', filter);
      if (append && nextCursor) params.set('cursor', nextCursor);
      params.set('limit', '20');

      const res = await fetch(`/api/community/feed?${params}`);
      const data = await res.json();

      if (append) {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      } else {
        setPosts(data.posts || []);
      }
      setNextCursor(data.nextCursor);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadFeed(); }, [filter]);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    return `hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-brand-olive/10 to-background pt-12 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-olive/10 text-brand-olive text-sm font-medium mb-4">
            <Globe className="h-4 w-4" /> Feed de la comunidad
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">
            Explora la comunidad
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Descubre contenido, productos y conversaciones de creadores de consciencia.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => setFilter(filter === f.value ? null : f.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                filter === f.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay publicaciones públicas aún.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const typeConfig = TYPE_BADGE[post.postType] || TYPE_BADGE.text;
              const TypeIcon = typeConfig.icon;

              return (
                <Link
                  key={post.id}
                  href={`/comunidad/${post.communityId}?post=${post.id}`}
                  className="block group"
                >
                  <article className="rounded-[24px] border border-border/40 bg-card p-5 hover:shadow-apple hover:-translate-y-0.5 transition-all duration-300">
                    {/* Community label + Author */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/60 overflow-hidden shrink-0">
                        {post.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {post.authorDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{post.authorDisplayName}</span>
                          <Badge className={`${typeConfig.className} border-0 text-[10px] px-2 py-0`}>
                            <TypeIcon className="h-2.5 w-2.5 mr-0.5" />{typeConfig.label}
                          </Badge>
                        </div>
                        {post.community && (
                          <span className="text-xs text-muted-foreground">
                            en {post.community.title} · {timeAgo(post.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-foreground/85 leading-relaxed mb-3 line-clamp-4">
                      {post.contentSnapshot}
                    </p>

                    {/* Attachment preview */}
                    {post.attachments && post.attachments.length > 0 && post.attachments[0].type === 'image' && (
                      <div className="rounded-2xl overflow-hidden mb-3 border border-border/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.attachments[0].url} alt="" className="w-full max-h-[300px] object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                      </div>
                    )}

                    {/* Momento preview */}
                    {post.attachments && post.attachments.length > 0 && post.attachments[0].type === 'momento' && (
                      <div className="rounded-2xl overflow-hidden mb-3 border border-border/20 relative bg-black aspect-[9/16] max-h-[300px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film className="h-12 w-12 text-white/40" />
                        </div>
                        <Badge className="absolute bottom-3 left-3 bg-pink-500/90 text-white border-0 text-xs">
                          <Film className="h-3 w-3 mr-1" /> Momento
                        </Badge>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-5 text-muted-foreground text-sm">
                      <span className="flex items-center gap-1.5">
                        <Heart className="h-4 w-4" /> {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4" /> {post.commentsCount}
                      </span>
                      <span className="ml-auto text-xs text-brand-chambray opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Ver en la comunidad <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}

            {/* Load more */}
            {nextCursor && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => loadFeed(true)}
                  disabled={loadingMore}
                  className="rounded-2xl"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Cargar más
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
