'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, CornerDownRight, Send, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  postId: string;
  communityId: string;
  authorUid: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  content: string;
  parentCommentId: string | null;
  likes: string[];
  createdAt: string;
}

interface CommentThreadProps {
  communityId: string;
  postId: string;
  currentUid: string;
}

export function CommentThread({ communityId, postId, currentUid }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/community/${communityId}/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadComments(); }, [communityId, postId]);

  const submitComment = async (content: string, parentCommentId: string | null) => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/community/${communityId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, parentCommentId }),
      });
      if (parentCommentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      await loadComments();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Organize into threads: top-level + replies
  const topLevel = comments.filter(c => !c.parentCommentId);
  const replies = (parentId: string) => comments.filter(c => c.parentCommentId === parentId);

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-2.5 ${isReply ? 'ml-10' : ''}`}>
      <div className="w-7 h-7 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 overflow-hidden">
        {comment.authorAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.authorAvatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold text-muted-foreground">
            {comment.authorDisplayName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary/30 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs">{comment.authorDisplayName}</span>
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/85 mt-0.5 whitespace-pre-wrap">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            <Heart className={`h-3 w-3 ${comment.likes.includes(currentUid) ? 'fill-red-500 text-red-500' : ''}`} />
            {comment.likes.length > 0 && comment.likes.length}
          </button>
          {!isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CornerDownRight className="h-3 w-3" /> Responder
            </button>
          )}
        </div>

        {/* Reply input (inline) */}
        {replyingTo === comment.id && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment(replyText, comment.id)}
              placeholder="Escribe tu respuesta..."
              className="flex-1 text-sm bg-secondary/40 rounded-xl px-3 py-2 outline-none border border-border/30 focus:border-primary/30"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => submitComment(replyText, comment.id)}
              disabled={isSending || !replyText.trim()}
              className="rounded-xl h-8 px-3"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Render replies to this comment */}
        {replies(comment.id).length > 0 && (
          <div className="mt-2 space-y-2">
            {replies(comment.id).map(r => renderComment(r, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="border-t border-border/20 bg-secondary/5">
      {/* Comments list */}
      <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : topLevel.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Sé el primero en comentar</p>
        ) : (
          topLevel.map(c => renderComment(c))
        )}
      </div>

      {/* New comment input */}
      <div className="px-4 py-3 border-t border-border/20 flex gap-2 items-center">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment(newComment, null)}
          placeholder="Escribe un comentario..."
          className="flex-1 text-sm bg-secondary/40 rounded-xl px-3 py-2.5 outline-none border border-border/30 focus:border-primary/30 transition-colors"
        />
        <Button
          size="sm"
          onClick={() => submitComment(newComment, null)}
          disabled={isSending || !newComment.trim()}
          className="rounded-xl ios-button h-9 px-4"
        >
          {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
