'use client';

import React, { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Pin, Trash2, Award, MoreHorizontal, Globe, Lock, Megaphone, HelpCircle, Film, ShoppingBag, Sparkles, FileText } from 'lucide-react';
import type { CommunityPostProperties, PostType } from '@/backend/community/domain/entities/community-post.entity';
import { CommentThread } from '@/components/community/CommentThread';

const TYPE_BADGE: Record<PostType, { label: string; icon: React.ElementType; className: string }> = {
  text:             { label: 'Publicación',     icon: FileText,    className: 'bg-secondary text-foreground' },
  announcement:     { label: 'Anuncio',         icon: Megaphone,   className: 'bg-blue-500/10 text-blue-600' },
  question:         { label: 'Pregunta',        icon: HelpCircle,  className: 'bg-amber-500/10 text-amber-600' },
  free_content:     { label: 'Contenido Libre', icon: Sparkles,    className: 'bg-green-500/10 text-green-600' },
  product_showcase: { label: 'Producto',        icon: ShoppingBag, className: 'bg-purple-500/10 text-purple-600' },
  momento:          { label: 'Momento',         icon: Film,        className: 'bg-pink-500/10 text-pink-600' },
};

interface PostCardProps {
  post: CommunityPostProperties;
  currentUid: string;
  isAdmin: boolean;
  communityId: string;
  onRefresh: () => void;
}

export function PostCard({ post, currentUid, isAdmin, communityId, onRefresh }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(post.likes.includes(currentUid));
  const [likeCount, setLikeCount] = useState(post.likes.length);

  const typeConfig = TYPE_BADGE[post.postType] || TYPE_BADGE.text;
  const TypeIcon = typeConfig.icon;

  const handleLike = async () => {
    const prev = liked;
    setLiked(!liked);
    setLikeCount(c => prev ? c - 1 : c + 1);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/community/${communityId}/posts/${post.id}/like`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setLiked(prev);
      setLikeCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handlePin = async () => {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`/api/community/${communityId}/posts/${post.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    const token = await auth.currentUser?.getIdToken();
    await fetch(`/api/community/${communityId}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  };

  const handleMarkAnswer = async () => {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`/api/community/${communityId}/posts/${post.id}/mark-answer`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    onRefresh();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  };

  const canDelete = isAdmin || post.authorUid === currentUid;

  return (
    <article className="rounded-[24px] border border-border/40 bg-card overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="p-4 pb-2 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 overflow-hidden">
          {post.authorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {post.authorDisplayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{post.authorDisplayName}</span>
            <Badge className={`${typeConfig.className} border-0 text-[10px] px-2 py-0.5`}>
              <TypeIcon className="h-2.5 w-2.5 mr-1" />{typeConfig.label}
            </Badge>
            {post.visibility === 'public' && (
              <Globe className="h-3 w-3 text-green-500" />
            )}
            {post.pinnedAt && (
              <Pin className="h-3 w-3 text-amber-500 fill-amber-500" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Menu */}
        {(isAdmin || canDelete) && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-secondary/60 transition-colors">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-card border border-border/60 rounded-2xl shadow-xl z-10 min-w-[180px] py-1 overflow-hidden">
                {isAdmin && (
                  <button onClick={handlePin} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/40 flex items-center gap-2">
                    <Pin className="h-3.5 w-3.5" /> {post.pinnedAt ? 'Desfijar' : 'Fijar arriba'}
                  </button>
                )}
                {isAdmin && post.postType === 'question' && (
                  <button onClick={handleMarkAnswer} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/40 flex items-center gap-2">
                    <Award className="h-3.5 w-3.5" /> {post.isOfficialAnswer ? 'Desmarcar respuesta' : 'Marcar respuesta oficial'}
                  </button>
                )}
                {canDelete && (
                  <button onClick={handleDelete} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary/40 flex items-center gap-2 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="px-4 pb-3">
          <div className={`grid gap-2 ${post.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.attachments.map((att, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/20 bg-secondary/10">
                {att.type === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.url} alt="" className="w-full max-h-[400px] object-cover" />
                )}
                {(att.type === 'video' || att.type === 'momento') && (
                  <video src={att.url} controls className="w-full max-h-[400px]" />
                )}
                {att.type === 'pdf' && (
                  <a href={att.url} target="_blank" rel="noopener" className="flex items-center gap-2 p-3 text-sm text-brand-chambray hover:underline">
                    📄 {att.fileName || 'Documento PDF'}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official answer badge */}
      {post.isOfficialAnswer && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-600 text-sm font-medium">
          <Award className="h-4 w-4" /> Respuesta oficial del creador
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border/20 flex items-center gap-4">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
          <Heart className={`h-4 w-4 ${liked ? 'fill-red-500' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" />
          <span>{post.commentsCount}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentThread
          communityId={communityId}
          postId={post.id}
          currentUid={currentUid}
        />
      )}
    </article>
  );
}
