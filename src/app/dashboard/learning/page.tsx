'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, BookOpen, Download, Users, Mic, Briefcase, Globe, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  course:     { label: 'Curso',           icon: BookOpen,   color: 'text-brand-terracotta', bg: 'bg-brand-terracotta/10' },
  download:   { label: 'Descarga Digital',icon: Download,   color: 'text-brand-sandstone',  bg: 'bg-brand-sandstone/10' },
  membership: { label: 'Membresía',       icon: Users,      color: 'text-brand-chambray',   bg: 'bg-brand-chambray/10' },
  coaching:   { label: 'Coaching 1:1',    icon: Briefcase,  color: 'text-primary',          bg: 'bg-primary/10' },
  podcast:    { label: 'Podcast',         icon: Mic,        color: 'text-brand-clove',      bg: 'bg-brand-clove/10' },
  community:  { label: 'Comunidad',       icon: Globe,      color: 'text-brand-olive',      bg: 'bg-brand-olive/10' },
};

export default function LearningPage() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/student/my-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setItems(data.enrolledItems || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div>
        <h1 className="text-largeTitle font-bold text-foreground">Mi Librería</h1>
        <p className="text-secondary-foreground mt-1">
          Todos tus cursos, descargas, podcasts y membresías adquiridas.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="ios-list mt-8">
          <div className="ios-list-item justify-center flex-col gap-3 text-secondary-foreground py-16">
            <BookOpen className="h-10 w-10 opacity-20" />
            <p>No tienes productos en tu librería actualmente.</p>
            <Link href="/products" className="text-brand-chambray font-medium hover:underline mt-2">
              Explorar el catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {items.map((item) => {
            const config = TYPE_CONFIG[item.assetType] || TYPE_CONFIG.course;
            const IconComponent = config.icon;
            
            // Route mapping for consumption
            const href = item.assetType === 'course' ? `/learn/${item.assetReferenceId}`
                       : item.assetType === 'download' ? `/dashboard/learning/download/${item.assetReferenceId}`
                       : item.assetType === 'podcast' ? `/dashboard/learning/podcast/${item.assetReferenceId}`
                       : `/dashboard/learning/${item.assetType}/${item.assetReferenceId}`;

            return (
              <Link href={href} key={item.id} className="group block h-full">
                <div className="h-full flex flex-col rounded-[24px] border border-border/50 overflow-hidden bg-card hover:shadow-apple hover:-translate-y-1 transition-all duration-300">
                  {/* Cover */}
                  <div className="relative aspect-video overflow-hidden bg-secondary/20">
                    {item.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverUrl} alt={item.publicName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconComponent className={`h-12 w-12 opacity-20 ${config.color}`} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-0 shadow-sm text-xs font-medium">
                        <IconComponent className={`h-3 w-3 mr-1 ${config.color}`} />
                        {config.label}
                      </Badge>
                    </div>
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <PlayCircle className="h-12 w-12 text-white shadow-lg rounded-full" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-2">{item.publicName}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-brand-chambray group-hover:translate-x-1 transition-transform">
                      Acceder al contenido →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
