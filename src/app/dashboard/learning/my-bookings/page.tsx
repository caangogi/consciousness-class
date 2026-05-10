'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Loader2, XCircle, CheckCircle2, AlertTriangle, Video } from 'lucide-react';

// ----- Local types (mirror of BookingProperties from the API; the page
// stays decoupled from backend types intentionally) -----
type BookingStatus = 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';

interface Booking {
  id: string;
  assetId: string;
  creatorUid: string;
  patientUid: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  meetLink: string | null;
  refundEligible: boolean | null;
  paymentSessionId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ----- Status presentation -----
const STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Pago pendiente', cls: 'bg-amber-100 text-amber-900',  icon: Clock },
  scheduled:       { label: 'Confirmada',     cls: 'bg-emerald-100 text-emerald-900', icon: CheckCircle2 },
  completed:       { label: 'Completada',     cls: 'bg-stone-200 text-stone-700', icon: CheckCircle2 },
  cancelled:       { label: 'Cancelada',      cls: 'bg-rose-100 text-rose-900',   icon: XCircle },
  no_show:         { label: 'No asististe',   cls: 'bg-zinc-200 text-zinc-700',   icon: AlertTriangle },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

export default function MyBookingsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/student/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err: any) {
      toast({
        title: 'No pudimos cargar tus reservas',
        description: err?.message ?? 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCancel(bookingId: string): Promise<void> {
    setCancellingId(bookingId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      const eligible = data?.booking?.refundEligible;
      toast({
        title: 'Reserva cancelada',
        description: eligible === true
          ? 'Tu reembolso completo se procesará en 5–10 días hábiles.'
          : eligible === false
          ? 'No es elegible para reembolso (cancelaciones con menos de 24 h).'
          : 'No hay cargo asociado a esta cancelación.',
      });
      await load();
    } catch (err: any) {
      toast({
        title: 'No pudimos cancelar',
        description: err?.message ?? 'Inténtalo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis reservas</h1>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis reservas</h1>
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no tienes reservas. Explora{' '}
            <a href="/products" className="underline text-primary">
              el catálogo de sesiones de coaching
            </a>{' '}
            para reservar tu primera.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mis reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Próximas, pasadas y canceladas. Puedes cancelar las próximas hasta 24 h antes para recibir reembolso completo.
        </p>
      </div>

      <div className="space-y-3">
        {bookings.map((b) => {
          const cfg = STATUS_CONFIG[b.status];
          const StatusIcon = cfg.icon;
          const upcoming = b.status === 'scheduled' && isFuture(b.startTime);
          const refundable = upcoming && hoursUntil(b.startTime) > 24;
          const canCancelInUI = b.status === 'scheduled' || b.status === 'pending_payment';

          return (
            <Card key={b.id} className="rounded-2xl shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold capitalize">
                    {formatDate(b.startTime)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(b.startTime)} – {formatTime(b.endTime)}
                  </p>
                </div>
                <Badge className={`${cfg.cls} rounded-full px-3 py-1 font-medium`}>
                  <StatusIcon className="h-3.5 w-3.5 mr-1.5 inline" />
                  {cfg.label}
                </Badge>
              </CardHeader>

              <CardContent className="pt-2 space-y-3">
                {b.meetLink && upcoming && (
                  <a
                    href={b.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline"
                  >
                    <Video className="h-4 w-4" />
                    Unirme a la sesión
                  </a>
                )}

                {b.status === 'cancelled' && b.refundEligible !== null && (
                  <p className="text-sm text-muted-foreground">
                    {b.refundEligible
                      ? 'Reembolso elegible — se procesa en 5–10 días hábiles.'
                      : 'Sin reembolso (cancelación con menos de 24 h de antelación).'}
                  </p>
                )}

                {canCancelInUI && (
                  <div className="flex items-center gap-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cancellingId === b.id}
                          className="text-destructive border-destructive/40 hover:bg-destructive/10"
                        >
                          {cancellingId === b.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1.5" />
                          )}
                          Cancelar reserva
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {refundable ? (
                              <>
                                Faltan más de 24 h para tu sesión, así que recibirás{' '}
                                <strong>reembolso completo</strong> en 5–10 días hábiles.
                              </>
                            ) : upcoming ? (
                              <>
                                Tu sesión es en menos de 24 h. La cancelación{' '}
                                <strong>no será elegible para reembolso</strong>.
                              </>
                            ) : (
                              'Esta reserva se cancelará. No hay cargo asociado.'
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onCancel(b.id)}>
                            Sí, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <Calendar className="h-3 w-3" />
                  <span>Reservada el {formatDate(b.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
