'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, Download, Users, Mic, Briefcase, Globe, Filter, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CatalogItem {
  id: string;
  assetType: 'course' | 'download' | 'membership' | 'coaching' | 'podcast' | 'community';
  publicName: string;
  coverUrl: string | null;
  price: number;
  currency: string;
  shortDescription?: string;
  creatorUid: string;
  referralPolicy?: any; // Engine Fase 3 Link
  status: 'draft' | 'published' | 'archived';
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course: { label: 'Curso', icon: BookOpen, color: 'text-brand-terracotta' },
  download: { label: 'Descarga', icon: Download, color: 'text-brand-sandstone' },
  membership: { label: 'Membresía', icon: Users, color: 'text-brand-chambray' },
  coaching: { label: 'Coaching', icon: Briefcase, color: 'text-primary' },
  podcast: { label: 'Podcast', icon: Mic, color: 'text-brand-clove' },
  community: { label: 'Comunidad', icon: Globe, color: 'text-brand-olive' },
};

const FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'course', label: 'Cursos' },
  { value: 'download', label: 'Descargas' },
  { value: 'membership', label: 'Membresías' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'podcast', label: 'Podcasts' },
  { value: 'community', label: 'Comunidades' },
];

export default function StoreCatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const url = activeFilter === 'all' ? '/api/store/catalog' : `/api/store/catalog?type=${activeFilter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error cargando el catálogo');
        const data = await res.json();
        setItems(data.items || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [activeFilter]);

  const filtered = items.filter(item =>
    !search || item.publicName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-sandstone/20 to-background px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-4">Explora el Catálogo</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Cursos, mentorías, descargas, podcasts y comunidades creadas por terapeutas y educadores holísticos.
        </p>
        <div className="mt-8 relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            className="pl-12 h-12 rounded-2xl text-base border-border/50 shadow-sm bg-background"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === f.value
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay productos publicados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(item => {
              const config = TYPE_CONFIG[item.assetType] || TYPE_CONFIG.course;
              const IconComponent = config.icon;
              const href = item.assetType === 'community'
                ? `/comunidad/${item.id}`
                : `/products/${item.id}`;

              return (
                <Link href={href} key={item.id} className="group block">
                  <div className="rounded-[24px] border border-border/50 overflow-hidden bg-card hover:shadow-apple hover:-translate-y-1 transition-all duration-300">
                    {/* Cover */}
                    <div className="relative aspect-[9/12] overflow-hidden bg-secondary/20">
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.publicName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <IconComponent className={`h-16 w-16 opacity-20 ${config.color}`} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm border-0 shadow-sm text-xs font-medium">
                          <IconComponent className={`h-3 w-3 mr-1 ${config.color}`} />
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2">{item.publicName}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.shortDescription || ''}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-foreground">
                          {item.price === 0 ? 'Gratis' : `${item.price.toFixed(2)} ${item.currency}`}
                        </span>
                        <span className="text-xs text-brand-terracotta font-medium group-hover:translate-x-1 transition-transform">
                          Ver →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
