'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Users, Mic, Briefcase, Globe, ArrowLeft, ShoppingCart, CheckCircle, Lock, BookOpen, Star, Play } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/shared/AuthModal';
import { BookingWidget } from '@/components/booking/BookingWidget';

interface CatalogItem {
  id: string;
  assetType: string;
  publicName: string;
  coverUrl: string | null;
  price: number;
  currency: string;
  shortDescription?: string;
  assetReferenceId: string;
  creatorUid: string;
  referralPolicy?: any;
  status: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  course:     { label: 'Curso',           icon: BookOpen,   color: 'text-brand-terracotta', bg: 'bg-brand-terracotta/10', gradient: 'from-brand-terracotta/20' },
  download:   { label: 'Descarga Digital',icon: Download,   color: 'text-brand-sandstone',  bg: 'bg-brand-sandstone/10',  gradient: 'from-brand-sandstone/20' },
  membership: { label: 'Membresía',       icon: Users,      color: 'text-brand-chambray',   bg: 'bg-brand-chambray/10',   gradient: 'from-brand-chambray/20' },
  coaching:   { label: 'Coaching 1:1',    icon: Briefcase,  color: 'text-primary',          bg: 'bg-primary/10',          gradient: 'from-primary/20' },
  podcast:    { label: 'Podcast',         icon: Mic,        color: 'text-brand-clove',      bg: 'bg-brand-clove/10',      gradient: 'from-brand-clove/20' },
  community:  { label: 'Comunidad',       icon: Globe,      color: 'text-brand-olive',      bg: 'bg-brand-olive/10',      gradient: 'from-brand-olive/20' },
};

const INCLUDES: Record<string, { icon: React.ElementType; text: string }[]> = {
  course: [
    { icon: Play,         text: 'Acceso inmediato a todas las lecciones' },
    { icon: CheckCircle,  text: 'Certificado de completación' },
    { icon: Star,         text: 'Contenido actualizado de por vida' },
  ],
  download: [
    { icon: Download,     text: 'Descarga inmediata del archivo' },
    { icon: CheckCircle,  text: 'Acceso ilimitado de por vida' },
    { icon: Star,         text: 'PDF de alta calidad' },
  ],
  membership: [
    { icon: Users,        text: 'Acceso mensual a todo el contenido exclusivo' },
    { icon: CheckCircle,  text: 'Cancela cuando quieras, sin penalización' },
    { icon: Star,         text: 'Actualizaciones y nuevo contenido continuo' },
  ],
  coaching: [
    { icon: Briefcase,    text: 'Sesión personalizada 1:1 (60 min)' },
    { icon: CheckCircle,  text: 'Plan de acción post-sesión incluido' },
    { icon: Star,         text: 'Acceso por email 48h después de la sesión' },
  ],
  podcast: [
    { icon: Mic,          text: 'Todos los episodios disponibles al instante' },
    { icon: CheckCircle,  text: 'Audio premium, sin publicidad' },
    { icon: Star,         text: 'Nuevos episodios incluidos automáticamente' },
  ],
  community: [
    { icon: Users,        text: 'Acceso al espacio privado de la comunidad' },
    { icon: CheckCircle,  text: 'Conexión directa con el creador y miembros' },
    { icon: Star,         text: 'Eventos y sesiones en vivo exclusivos' },
  ],
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/store/catalog/${params.id}`);
        if (!res.ok) throw new Error('Producto no encontrado');
        const data = await res.json();
        setItem(data.item);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  const startCheckout = async () => {
    if (!item) return;
    if (item.price === 0) {
      toast({ title: '¡Acceso gratuito!', description: 'Este recurso es gratuito. Disfrútalo.' });
      return;
    }
    setIsCheckingOut(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ catalogItemId: item.id }),
      });
      const data = await res.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error(data.error || 'Error iniciando el pago');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePurchase = () => {
    if (!currentUser) {
      setShowAuthModal(true);  // Show modal instead of redirect
      return;
    }
    startCheckout();
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Small delay so Firebase auth state propagates via AuthContext
    setTimeout(() => startCheckout(), 800);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-destructive text-lg">{error || 'Producto no encontrado'}</p>
        <Button asChild variant="outline"><Link href="/products">Volver al catálogo</Link></Button>
      </div>
    );
  }

  const config = TYPE_CONFIG[item.assetType] || TYPE_CONFIG.download;
  const IconComponent = config.icon;
  const isFree = item.price === 0;
  const includesList = INCLUDES[item.assetType] || INCLUDES.download;

  return (
    <div className="min-h-screen bg-background">
      {/* AuthModal — low friction overlay */}
      {showAuthModal && (
        <AuthModal
          onSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          ctaContext={`Para adquirir "${item.publicName}" necesitas una cuenta gratuita.`}
        />
      )}

      {/* Hero gradient band */}
      <div className={`bg-gradient-to-b ${config.gradient} to-background pt-12 pb-6`}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <Button asChild variant="ghost" className="mb-6 -ml-2 text-muted-foreground">
            <Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Catálogo</Link>
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            {/* ── Cover ── */}
            <div className="lg:col-span-2">
              <div className="rounded-[32px] overflow-hidden aspect-[3/4] bg-secondary/20 shadow-2xl border border-border/20 relative">
                {item.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverUrl}
                    alt={item.publicName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <IconComponent className={`h-24 w-24 opacity-20 ${config.color}`} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className={`${config.bg} ${config.color} border-0 font-medium shadow-sm text-sm px-3 py-1`}>
                    <IconComponent className="h-3.5 w-3.5 mr-1.5" /> {config.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* ── Content + CTA ── */}
            <div className="lg:col-span-3 flex flex-col gap-8 pt-2">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                  {item.publicName}
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {item.shortDescription || 'Un recurso diseñado para acompañarte en tu camino de transformación personal.'}
                </p>
              </div>

              {/* What's included */}
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6 space-y-3">
                <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide mb-4">Qué incluye</h3>
                {includesList.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className={`p-1 rounded-full ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              {/* CTA Block */}
              {item.assetType === 'coaching' ? (
                /* ── Coaching: Calendar booking widget ── */
                <BookingWidget
                  creatorUid={item.creatorUid}
                  assetId={item.assetReferenceId}
                  productName={item.publicName}
                  price={item.price}
                  currency={item.currency}
                  onRequireAuth={() => setShowAuthModal(true)}
                />
              ) : (
                /* ── Other products: standard checkout ── */
                <div className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-foreground">
                      {isFree ? 'Gratis' : `${item.price.toFixed(2)} ${item.currency}`}
                    </span>
                    {!isFree && (
                      <span className="text-base text-muted-foreground">
                        {item.assetType === 'membership' ? '/ mes' : 'pago único'}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={isCheckingOut}
                    className="w-full h-14 text-base rounded-2xl ios-button shadow-lg font-semibold"
                    size="lg"
                  >
                    {isCheckingOut
                      ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      : isFree
                      ? <CheckCircle className="mr-2 h-5 w-5" />
                      : <ShoppingCart className="mr-2 h-5 w-5" />
                    }
                    {isCheckingOut
                      ? 'Redirigiendo a Stripe…'
                      : isFree
                      ? 'Obtener Gratis'
                      : currentUser
                      ? 'Comprar Ahora'
                      : 'Comprar — Crear cuenta gratis'
                    }
                  </Button>

                  {!isFree && (
                    <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                      <Lock className="h-3 w-3" /> Pago 100% seguro a través de Stripe · SSL
                    </p>
                  )}

                  {!currentUser && (
                    <p className="text-xs text-center text-muted-foreground">
                      Al comprar crearás una cuenta gratuita automáticamente.{' '}
                      <button onClick={() => setShowAuthModal(true)} className="text-brand-chambray underline">
                        ¿Ya tienes cuenta? Entra aquí
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
