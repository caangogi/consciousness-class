'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, MessageCircle, Heart, Users, Megaphone, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import type { NotificationType } from '@/backend/community/domain/entities/notification.entity';

interface Notification {
  id: string;
  type: NotificationType;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  message: string;
  isRead: boolean;
  deepLink: string;
  createdAt: string;
}

const NOTIF_ICON: Record<NotificationType, React.ElementType> = {
  new_post: Megaphone,
  new_comment: MessageCircle,
  reply: MessageCircle,
  like: Heart,
  new_member: Users,
  product_mention: ShoppingBag,
};

export function NotificationBell() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!currentUser) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    const token = await auth.currentUser?.getIdToken();
    await fetch('/api/notifications', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markOneRead = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
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

  if (!currentUser) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary/60 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-card border border-border/60 rounded-[20px] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-chambray hover:underline flex items-center gap-1">
                <Check className="h-3 w-3" /> Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                Sin notificaciones
              </div>
            ) : (
              notifications.map(notif => {
                const Icon = NOTIF_ICON[notif.type] || Bell;
                return (
                  <Link
                    key={notif.id}
                    href={notif.deepLink}
                    onClick={() => { if (!notif.isRead) markOneRead(notif.id); setIsOpen(false); }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors border-b border-border/10 ${
                      !notif.isRead ? 'bg-primary/3' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center shrink-0 overflow-hidden">
                      {notif.actorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={notif.actorAvatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!notif.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(notif.createdAt)}</span>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
