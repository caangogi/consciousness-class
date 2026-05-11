'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { PostComposer } from '@/components/community/PostComposer';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Loader2, Users, Settings, ArrowLeft, Globe, Lock,
  BarChart3, FileText, Megaphone, HelpCircle, Film, MessageCircle, FolderX
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CommunityPostProperties } from '@/backend/community/domain/entities/community-post.entity';

interface CommunityData {
  id: string;
  title: string;
  shortDescription: string;
  coverUrl: string | null;
  creatorUid: string;
  isPrivate: boolean;
  feedVisibilityDefault: 'public' | 'members_only';
  linkedMembershipId: string | null;
}

export default function CreatorCommunityDashboard() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [community, setCommunity] = useState<CommunityData | null>(null);
  const [posts, setPosts] = useState<CommunityPostProperties[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [communityRes, postsRes, catalogRes] = await Promise.all([
        fetch(`/api/community/${params.id}`, { headers }),
        fetch(`/api/community/${params.id}/posts`, { headers }),
        fetch('/api/creator/catalog', { headers }),
      ]);

      const communityData = await communityRes.json();
      const postsData = await postsRes.json();
      const catalogData = await catalogRes.json();

      setCommunity(communityData.community);
      setPosts(postsData.posts || []);
      setCatalogItems(catalogData.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, params.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    // Skeleton mirrors the post-load layout: header strip + 4 stat
    // tiles + composer card + 2 post placeholders. Keeps perceived
    // performance high vs. a lone spinner.
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-9 w-9 sm:w-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10">
        <EmptyState
          icon={FolderX}
          tint="muted"
          title="Comunidad no encontrada"
          description="Es posible que esta comunidad haya sido eliminada o que el enlace no sea correcto. Vuelve al catálogo para ver tus productos."
          primary={{ label: 'Volver al catálogo', href: '/dashboard/products' }}
        />
      </div>
    );
  }

  const isCreator = currentUser?.uid === community.creatorUid;
  const filteredPosts = activeFilter
    ? posts.filter(p => p.postType === activeFilter)
    : posts;

  const stats = {
    total: posts.length,
    announcements: posts.filter(p => p.postType === 'announcement').length,
    questions: posts.filter(p => p.postType === 'question').length,
    momentos: posts.filter(p => p.postType === 'momento').length,
  };

  const FILTERS = [
    { value: null, label: 'Todos', count: stats.total },
    { value: 'announcement', label: 'Anuncios', icon: Megaphone, count: stats.announcements },
    { value: 'question', label: 'Preguntas', icon: HelpCircle, count: stats.questions },
    { value: 'momento', label: 'Momentos', icon: Film, count: stats.momentos },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mt-1">
          <Link href="/dashboard/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{community.title}</h1>
            <Badge className={`${community.isPrivate ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'} border-0`}>
              {community.isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Globe className="h-3 w-3 mr-1" />}
              {community.isPrivate ? 'Privada' : 'Pública'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{community.shortDescription}</p>
        </div>
        {isCreator && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-2xl flex-shrink-0"
            aria-label="Configurar comunidad"
            aria-expanded={showSettings}
          >
            <Settings className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Configurar</span>
          </Button>
        )}
      </div>

      {/* Quick Stats — also act as filters. Grid stacks to 2 cols on
          mobile so each tile keeps enough room for the icon + count. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FILTERS.map(f => {
          const isActive = activeFilter === f.value;
          const FilterIcon = f.icon;
          return (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => setActiveFilter(isActive ? null : f.value)}
              aria-pressed={isActive}
              className={cn(
                'rounded-2xl border p-3 text-left transition-all flex items-center gap-3 min-h-[60px]',
                isActive
                  ? 'border-primary/30 bg-primary/5 shadow-sm'
                  : 'border-border/40 bg-card hover:bg-secondary/30'
              )}
            >
              <div
                className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0',
                  isActive ? 'bg-primary/10 text-primary' : 'bg-secondary/60 text-muted-foreground'
                )}
              >
                {FilterIcon ? <FilterIcon className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground leading-none">{f.count}</div>
                <div className="text-[11px] text-muted-foreground mt-1 truncate">{f.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Settings Panel (inline) */}
      {showSettings && isCreator && (
        <div className="rounded-[24px] border border-border/50 bg-card p-6 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Configuración de la comunidad</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Visibilidad por defecto de nuevos posts</label>
              <div className="flex gap-2">
                <button className={`flex-1 p-2 rounded-xl text-sm border transition-colors ${community.feedVisibilityDefault === 'public' ? 'border-green-500/30 bg-green-500/10 text-green-600' : 'border-border/40'}`}>
                  <Globe className="h-3.5 w-3.5 mx-auto mb-1" /> Público
                </button>
                <button className={`flex-1 p-2 rounded-xl text-sm border transition-colors ${community.feedVisibilityDefault === 'members_only' ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : 'border-border/40'}`}>
                  <Lock className="h-3.5 w-3.5 mx-auto mb-1" /> Solo miembros
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Membresía vinculada</label>
              <p className="text-xs text-muted-foreground">
                {community.linkedMembershipId
                  ? `Vinculada: ${community.linkedMembershipId}`
                  : 'Sin membresía vinculada. Los usuarios deben comprar el acceso a la comunidad de forma independiente.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      {isCreator && (
        <PostComposer
          communityId={params.id}
          isCreator={isCreator}
          defaultVisibility={community.feedVisibilityDefault || 'members_only'}
          onPostCreated={loadData}
          catalogItems={catalogItems.map((i: any) => ({ id: i.id, publicName: i.publicName, coverUrl: i.coverUrl }))}
        />
      )}

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          activeFilter ? (
            // Filter-applied empty state: nudge user to clear the filter,
            // don't push them to create content of a type they may not
            // want to author. The "Mostrar todas" action lives outside
            // EmptyState because it's a state mutation, not a link.
            <div className="space-y-3">
              <EmptyState
                dense
                icon={FileText}
                tint="muted"
                title="No hay publicaciones de este tipo"
                description="Prueba con otro filtro o muestra todas las publicaciones para ver lo que ya hay en la comunidad."
              />
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setActiveFilter(null)} className="rounded-full">
                  Mostrar todas
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MessageCircle}
              tint="terracotta"
              title={isCreator ? 'Tu comunidad está vacía' : 'Aún no hay publicaciones'}
              description={
                isCreator
                  ? 'Inicia la conversación con un anuncio de bienvenida o una pregunta abierta para que tus miembros se presenten.'
                  : 'Cuando el creador o algún miembro publique, las conversaciones aparecerán aquí.'
              }
            />
          )
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUid={currentUser?.uid || ''}
              isAdmin={isCreator}
              communityId={params.id}
              onRefresh={loadData}
            />
          ))
        )}
      </div>
    </div>
  );
}
