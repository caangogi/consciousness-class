'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import {
  Calendar, Clock, Loader2, XCircle, CheckCircle2, AlertTriangle,
  User, Mail, UserX,
} from 'lucide-react';

type BookingStatus = 'pending_payment' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';

interface Booking {
  id: string;
  assetId: string;
  creatorUid: string;
  patientUid: string;
  patientName: string | null;
  patientEmail: string | null;
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

const STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending_payment: { label: 'Pago pendiente', cls: 'bg-amber-100 text-amber-900',     icon: Clock },
  scheduled:       { label: 'Confirmada',     cls: 'bg-emerald-100 text-emerald-900', icon: CheckCircle2 },
  completed:       { label: 'Completada',     cls: 'bg-stone-200 text-stone-700',     icon: CheckCircle2 },
  cancelled:       { label: 'Cancelada',      cls: 'bg-rose-100 text-rose-900',       icon: XCircle },
  no_show:         { label: 'No-show',        cls: 'bg-zinc-200 text-zinc-700',       icon: AlertTriangle },
};

const HOUR_MS = 60 * 60 * 1000;
const NO_SHOW_GRACE_MS = 30 * 60 * 1000;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now();
}

/** A booking can be marked no-show only by its creator AND only after
 *  endTime + 30min grace window (matches the BookingEntity guard). */
function canMarkNoShow(b: Booking): boolean {
  if (b.status !== 'scheduled') return false;
  const endTs = new Date(b.endTime).getTime();
  return Date.now() >= endTs + NO_SHOW_GRACE_MS;
}

export default function CreatorBookingsPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/creator/my-bookings', {
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

  async function callBookingAction(
    bookingId: string,
    path: 'cancel' | 'mark-no-show',
    successMsg: string,
  ): Promise<void> {
    setPendingActionId(bookingId);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/booking/${bookingId}/${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      toast({ title: successMsg });
      await load();
    } catch (err: any) {
      toast({
        title: 'Acción rechazada',
        description: err?.message ?? 'Inténtalo más tarde.',
        variant: 'destructive',
      });
    } finally {
      setPendingActionId(null);
    }
  }

  // Group bookings: upcoming + past for clearer scanning
  const grouped = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    for (const b of bookings) {
      if (b.status === 'scheduled' && !isPast(b.endTime)) upcoming.push(b);
      else past.push(b);
    }
    return { upcoming, past };
  }, [bookings]);

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
            Aún no tienes reservas. Cuando un paciente reserve y pague una sesión de coaching, aparecerá aquí.
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
          Sesiones que han reservado pacientes. Puedes cancelar futuras reservas y marcar como no-show
          tras 30 min de finalizada la sesión si el paciente no se presentó.
        </p>
      </div>

      {grouped.upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Próximas ({grouped.upcoming.length})
          </h2>
          {grouped.upcoming.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              pendingActionId={pendingActionId}
              onCancel={(id) => callBookingAction(id, 'cancel', 'Reserva cancelada.')}
              onNoShow={(id) => callBookingAction(id, 'mark-no-show', 'Marcada como no-show.')}
            />
          ))}
        </section>
      )}

      {grouped.past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Pasadas ({grouped.past.length})
          </h2>
          {grouped.past.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              pendingActionId={pendingActionId}
              onCancel={(id) => callBookingAction(id, 'cancel', 'Reserva cancelada.')}
              onNoShow={(id) => callBookingAction(id, 'mark-no-show', 'Marcada como no-show.')}
            />
          ))}
        </section>
      )}
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  pendingActionId: string | null;
  onCancel: (id: string) => void;
  onNoShow: (id: string) => void;
}

function BookingCard({ booking: b, pendingActionId, onCancel, onNoShow }: BookingCardProps) {
  const cfg = STATUS_CONFIG[b.status];
  const StatusIcon = cfg.icon;
  const cancellable = b.status === 'scheduled' || b.status === 'pending_payment';
  const noShowable = canMarkNoShow(b);
  const isBusy = pendingActionId === b.id;

  return (
    <Card className="rounded-2xl shadow-sm">
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
        <div className="text-sm space-y-1 text-foreground">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{b.patientName ?? 'Paciente'}</span>
          </div>
          {b.patientEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${b.patientEmail}`} className="text-primary underline">
                {b.patientEmail}
              </a>
            </div>
          )}
        </div>

        {(cancellable || noShowable) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {noShowable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isBusy}>
                    {isBusy ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <UserX className="h-4 w-4 mr-1.5" />
                    )}
                    Marcar no-show
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Marcar como no-show?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Confirmas que <strong>{b.patientName ?? 'el paciente'}</strong> no se presentó
                      a la sesión del {formatDate(b.startTime)} a las {formatTime(b.startTime)}.
                      Esta acción es definitiva y queda en el historial de la reserva.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onNoShow(b.id)}>
                      Sí, marcar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {cancellable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  >
                    {isBusy ? (
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
                      Cancelarás la sesión con <strong>{b.patientName ?? 'el paciente'}</strong>.
                      El paciente recibirá un email automático con la información de cancelación.
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
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
          <Calendar className="h-3 w-3" />
          <span>Reservada el {formatDate(b.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
