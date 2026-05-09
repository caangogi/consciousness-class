
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2, AlertTriangle, RefreshCw, BookOpen, ArrowRight, PlayCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { auth } from '@/lib/firebase/config';
import { cn } from '@/lib/utils';
import type { CatalogItemProperties } from '@/backend/catalog/domain/entities/catalog-item.entity';

export default function CreatorCatalogPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [catalogItems, setCatalogItems] = useState<CatalogItemProperties[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogItems = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) {
        throw new Error('No se pudo obtener el token de autenticación.');
      }

      const response = await fetch('/api/creator/catalog', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Error al cargar los activos del catálogo.');
      }
      const data = await response.json();
      setCatalogItems(data.catalogItems || []);
    } catch (err: any) {
      console.error("Error fetching catalog:", err);
      setError(err.message);
      toast({
        title: 'Error al Cargar Catálogo',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchCatalogItems();
  }, [fetchCatalogItems]);

  const getStatusBadgeVariant = (status: CatalogItemProperties['status']) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeClass = (status: CatalogItemProperties['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700';
      case 'archived':
        return 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getAssetIcon = (assetType: CatalogItemProperties['assetType']) => {
    switch (assetType) {
      case 'course':
        return <PlayCircle className="h-5 w-5 text-brand-terracotta" />;
      case 'download':
        return <Download className="h-5 w-5 text-brand-sandstone" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="text-center">
           <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <CardTitle className="text-2xl text-destructive">Error al Cargar Catálogo</CardTitle>
          <CardDescription className="text-base">
            No pudimos cargar tus activos en este momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-body text-destructive bg-destructive/10 p-3 rounded-md mb-4">{error}</p>
          <Button onClick={fetchCatalogItems} variant="default" className="ios-button">
            <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-1">
        <h1 className="text-largeTitle font-bold text-foreground">Mis Productos</h1>
        <Button asChild className="ios-button rounded-full">
          <Link href="/dashboard/products/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Crear Nuevo
          </Link>
        </Button>
      </div>

      <h2 className="text-footnote text-secondary-foreground uppercase pl-4 mb-2 tracking-wider font-medium">Listado de Activos</h2>
      {catalogItems.length > 0 ? (
        <div className="ios-list">
          {catalogItems.map((item) => (
             <Link key={item.id} href={item.assetType === 'course' ? `/dashboard/products/${item.assetReferenceId}` : item.assetType === 'community' ? `/dashboard/community/${item.assetReferenceId}` : `/dashboard/builder/${item.assetType}/${item.assetReferenceId}`} className="ios-list-item group min-h-[60px] block w-full py-3">
                <div className="flex w-full items-center justify-between gap-4">
                   <div className="flex-1 overflow-hidden flex items-center gap-3">
                      <div className="bg-secondary/20 p-2 rounded-lg">
                        {getAssetIcon(item.assetType)}
                      </div>
                      <div className="flex-1 overflow-hidden mb-1">
                         <h3 className="text-headline font-medium text-foreground truncate">{item.publicName}</h3>
                         <p className="text-subheadline text-secondary-foreground truncate max-w-sm capitalize">
                            {item.assetType === 'course' ? 'Curso Grabado' : item.assetType.replace('_', ' ')}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block mr-2">
                         <span className="text-subheadline text-foreground">${item.price} {item.currency}</span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(item.status)} className={cn("capitalize px-2 py-0.5 max-h-6 font-normal text-caption1", getStatusBadgeClass(item.status))}>
                        {item.status === 'published' ? 'Publicado' : item.status === 'archived' ? 'Archivado' : 'Borrador'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-[#C6C6C8] group-hover:text-primary transition-colors" />
                   </div>
                </div>
             </Link>
          ))}
        </div>
      ) : (
         <div className="ios-list py-12 px-6 text-center flex flex-col items-center justify-center">
             <BookOpen className="h-12 w-12 text-[#C6C6C8] mb-4" />
             <h3 className="text-headline font-semibold mb-1">No tienes productos activos</h3>
             <p className="text-subheadline text-secondary-foreground mb-4">Empieza a compartir tu conocimiento y crea tu primer activo ahora.</p>
             <Button asChild variant="outline" className="ios-button">
               <Link href="/dashboard/products/new">
                 <PlusCircle className="mr-2 h-4 w-4" /> Crear Primer Producto
               </Link>
             </Button>
         </div>
      )}
    </div>
  );
}
