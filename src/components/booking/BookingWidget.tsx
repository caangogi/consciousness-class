'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slot {
  startTime: string;
  endTime: string;
}

interface BookingWidgetProps {
  creatorUid: string;
  assetId: string;
  productName: string;
  price: number;
  currency: string;
  onRequireAuth?: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_ABBREVS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function formatDuration(startIso: string, endIso: string): string {
  const diff = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
  if (diff >= 60) return `${diff / 60}h`;
  return `${diff} min`;
}

export function BookingWidget({ creatorUid, assetId, productName, price, currency, onRequireAuth }: BookingWidgetProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    setSelectedDate(null);
    setSelectedSlot(null);
    try {
      const res = await fetch(
        `/api/booking/slots?creatorUid=${creatorUid}&assetId=${assetId}&year=${year}&month=${month}`
      );
      if (!res.ok) throw new Error('No se pudo cargar la disponibilidad');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [creatorUid, assetId, year, month, toast]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  // Build calendar grid
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  // Group slots by day
  const slotsByDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    const d = new Date(slot.startTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const isPast = (day: number) => {
    const d = new Date(year, month - 1, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const getDayKey = (day: number) => 
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleReserveAndCheckout = async () => {
    if (!currentUser) { onRequireAuth?.(); return; }
    if (!selectedSlot) return;

    setIsBooking(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);

      // 1. Reserve the slot
      const reserveRes = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          creatorUid,
          assetId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        }),
      });

      if (!reserveRes.ok) {
        const err = await reserveRes.json();
        throw new Error(err.error || 'Error reservando el horario');
      }
      const { bookingId } = await reserveRes.json();

      // 2. Create Stripe checkout session with the bookingId
      const checkoutRes = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ catalogItemId: assetId, bookingId }),
      });
      const checkoutData = await checkoutRes.json();

      if (checkoutData.sessionUrl) {
        window.location.href = checkoutData.sessionUrl;
      } else {
        throw new Error(checkoutData.error || 'Error iniciando el pago');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/40 bg-card/80 backdrop-blur p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Elige tu horario</h3>
          <p className="text-xs text-muted-foreground">Selecciona el día y hora que mejor te venga</p>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-semibold text-foreground text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day abbrevs */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_ABBREVS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {loadingSlots ? (
        <div className="h-32 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const key = getDayKey(day);
            const hasSlots = !!slotsByDay[key]?.length;
            const past = isPast(day);
            const isSelected = selectedDate === key;

            return (
              <button
                key={day}
                disabled={past || !hasSlots}
                onClick={() => { setSelectedDate(key); setSelectedSlot(null); }}
                className={cn(
                  'relative h-9 w-9 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center',
                  past && 'text-muted-foreground/30 cursor-not-allowed',
                  !past && !hasSlots && 'text-muted-foreground/50 cursor-not-allowed',
                  !past && hasSlots && !isSelected && 'text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer',
                  isSelected && 'bg-primary text-white shadow-md',
                  !past && hasSlots && !isSelected && 'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary'
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {/* Time slots for selected day */}
      {selectedDate && slotsByDay[selectedDate] && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Horas disponibles
          </h4>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {slotsByDay[selectedDate].map((slot, i) => {
              const isActive = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'text-sm px-3 py-2.5 rounded-xl border transition-all text-left font-medium',
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'border-border/40 text-foreground hover:border-primary/50 hover:bg-primary/5'
                  )}
                >
                  {formatTime(slot.startTime)}
                  <span className={cn('text-xs block font-normal', isActive ? 'text-white/70' : 'text-muted-foreground')}>
                    {formatDuration(slot.startTime, slot.endTime)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button
        className="w-full h-12 rounded-2xl ios-button font-semibold"
        disabled={!selectedSlot || isBooking}
        onClick={handleReserveAndCheckout}
      >
        {isBooking ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4 mr-2" />
        )}
        {isBooking
          ? 'Reservando…'
          : selectedSlot
          ? `Reservar y Pagar — ${price.toFixed(2)} ${currency}`
          : 'Selecciona un horario'}
      </Button>
    </div>
  );
}
