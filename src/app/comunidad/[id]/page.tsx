'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { PostComposer } from '@/components/community/PostComposer';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/shared/AuthModal';
import {
  Loader2, Users, Globe, Lock, ShoppingCart, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import type { CommunityPostProperties } from '@/backend/community/domain/entities/community-post.entity';

interface CommunityInfo {
  id: string;
  title: string;
  shortDescription: string;
  coverUrl: string | null;
  creatorUid: string;
  isPrivate: boolean;
  price?: number;
  communityGuidelines?: string;
  isMember: boolean;
}

export default function CommunityPage() {
  const params = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [posts, setPosts] = useState<CommunityPostProperties[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (currentUser) {
        const token = await auth.currentUser?.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const [communityRes, postsRes] = await Promise.all([
        fetch(`/api/community/${params.id}`, { headers }),
        fetch(`/api/community/${params.id}/posts`, { headers }),
      ]);

      const communityData = await communityRes.json();
      const postsData = await postsRes.json();

      setCommunity(communityData.community);
      setPosts(postsData.posts || []);
      setIsMember(postsData.isMember || false);
      setIsAdmin(postsData.isAdmin || false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, params.id]);

  const handleJoinFree = async () => {
    if (!currentUser) { setShowAuthModal(true); return; }
    setIsJoining(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/community/${params.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadData(); // Refresh to show member state
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => { loadData(); }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground text-lg">Comunidad no encontrada</p>
        <Button asChild variant="outline"><Link href="/comunidad">Ver todas</Link></Button>
      </div>
    );
  }

  const canPost = isMember || isAdmin;

  return (
    <div className="min-h-screen bg-background">
      {showAuthModal && (
        <AuthModal
          onSuccess={() => { setShowAuthModal(false); loadData(); }}
          onClose={() => setShowAuthModal(false)}
          ctaContext={`Únete a "${community.title}" para interactuar.`}
        />
      )}

      {/* Hero Banner */}
      <div className="relative">
        {community.coverUrl ? (
          <div className="h-48 sm:h-64 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-brand-olive/20 to-brand-chambray/20" />
        )}

        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20 z-10">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] bg-card border-4 border-background shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {community.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
            <div className="pb-2 flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">{community.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${community.isPrivate ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'} border-0 text-xs`}>
                  {community.isPrivate ? <Lock className="h-2.5 w-2.5 mr-1" /> : <Globe className="h-2.5 w-2.5 mr-1" />}
                  {community.isPrivate ? 'Privada' : 'Pública'}
                </Badge>
                {isMember && (
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">
                    <Users className="h-2.5 w-2.5 mr-1" /> Miembro
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Description */}
        <p className="text-sm text-muted-foreground">{community.shortDescription}</p>

        {/* Guidelines */}
        {community.communityGuidelines && isMember && (
          <details className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-secondary/30 transition-colors">
              📋 Normas de la comunidad
            </summary>
            <div className="px-4 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {community.communityGuidelines}
            </div>
          </details>
        )}

        {/* Join CTA for non-members */}
        {!canPost && (
          <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
            <Users className="h-10 w-10 text-primary/40 mx-auto" />
            <h3 className="font-semibold text-foreground">Únete a esta comunidad</h3>
            <p className="text-sm text-muted-foreground">
              {community.isPrivate
                ? 'Esta es una comunidad privada. Necesitas ser miembro para ver todo el contenido e interactuar.'
                : 'Únete para participar en las conversaciones, hacer preguntas y conectar con otros miembros.'}
            </p>
            {!currentUser ? (
              <Button onClick={() => setShowAuthModal(true)} className="rounded-2xl ios-button">
                Crear cuenta gratis para unirte
              </Button>
            ) : community.price && community.price > 0 ? (
              <Button asChild className="rounded-2xl ios-button">
                <Link href={`/products/${params.id}`}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Unirse por {community.price.toFixed(2)} €
                </Link>
              </Button>
            ) : (
              <Button
                className="rounded-2xl ios-button"
                onClick={handleJoinFree}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Unirse gratis
              </Button>
            )}
          </div>
        )}

        {/* Composer (only for members) */}
        {canPost && (
          <PostComposer
            communityId={params.id}
            isCreator={isAdmin}
            defaultVisibility="members_only"
            onPostCreated={loadData}
          />
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Aún no hay publicaciones en esta comunidad.
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUid={currentUser?.uid || ''}
                isAdmin={isAdmin}
                communityId={params.id}
                onRefresh={loadData}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
