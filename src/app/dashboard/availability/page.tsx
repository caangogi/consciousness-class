'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Save, Clock, Globe, CheckCircle, CalendarOff } from 'lucide-react';
import type { WeeklySchedule, TimeSlot } from '@/backend/booking/domain/entities/availability.entity';

// Default empty schedule to avoid undefined.map errors
function buildDefaultSchedule(): WeeklySchedule {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, i) => [i, { active: false, slots: [] }])
  ) as WeeklySchedule;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TIMEZONES = [
  { value: 'Europe/Madrid', label: '🇪🇸  Europa / Madrid' },
  { value: 'Europe/London', label: '🇬🇧  Europa / Londres' },
  { value: 'America/New_York', label: '🇺🇸  América / New York' },
  { value: 'America/Los_Angeles', label: '🇺🇸  América / Los Angeles' },
  { value: 'America/Bogota', label: '🇨🇴  América / Bogotá' },
  { value: 'America/Mexico_City', label: '🇲🇽  América / Ciudad de México' },
  { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷  América / Buenos Aires' },
  { value: 'America/Santiago', label: '🇨🇱  América / Santiago' },
  { value: 'America/Lima', label: '🇵🇪  América / Lima' },
];

export default function AvailabilityPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(buildDefaultSchedule());
  /** Vacation / blocked-date overrides. Today the UI only creates entries
   *  with available=false (blocking days). The shape supports available=true
   *  for "open a normally-closed day" but that's deferred — most creators
   *  use the weekly schedule + vacation blocks. */
  const [exceptions, setExceptions] = useState<Array<{ date: string; available: boolean }>>([]);
  const [newExceptionDate, setNewExceptionDate] = useState<string>('');

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // Use auth.currentUser (same pattern as rest of the app)
        const token = await auth.currentUser?.getIdToken(true);
        if (!token) { setLoading(false); return; }

        const res = await fetch('/api/creator/availability', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTimezone(data.availability.timezone || 'Europe/Madrid');
          // Ensure every day index 0-6 exists to prevent .map errors
          const incoming = data.availability.weeklySchedule as WeeklySchedule;
          const safe = buildDefaultSchedule();
          for (let i = 0; i <= 6; i++) {
            if (incoming[i]) safe[i] = incoming[i];
          }
          setWeeklySchedule(safe);
          // Load exceptions, sort ascending so the list reads naturally.
          const incomingExc = Array.isArray(data.availability.exceptions)
            ? data.availability.exceptions
            : [];
          setExceptions([...incomingExc].sort((a, b) => a.date.localeCompare(b.date)));
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
      } finally {
        setLoading(false);
      }
    };

    // Wait a tick for Firebase auth to hydrate
    const timer = setTimeout(fetchAvailability, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const token = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timezone, weeklySchedule, exceptions }),
      });
      if (res.ok) {
        setSaved(true);
        toast({ title: 'Guardado ✓', description: 'Tu disponibilidad ha sido actualizada.' });
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Server error');
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar. Intenta de nuevo.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (idx: number, active: boolean) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [idx]: {
        active,
        slots: active && (!prev[idx]?.slots?.length)
          ? [{ start: '09:00', end: '17:00' }]
          : prev[idx]?.slots ?? [],
      }
    }));
  };

  const updateSlot = (dayIdx: number, slotIdx: number, field: 'start' | 'end', value: string) => {
    setWeeklySchedule(prev => {
      const slots = [...(prev[dayIdx]?.slots ?? [])];
      slots[slotIdx] = { ...slots[slotIdx], [field]: value };
      return { ...prev, [dayIdx]: { ...prev[dayIdx], slots } };
    });
  };

  const addSlot = (dayIdx: number) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], slots: [...(prev[dayIdx]?.slots ?? []), { start: '10:00', end: '12:00' }] }
    }));
  };

  const removeSlot = (dayIdx: number, slotIdx: number) => {
    setWeeklySchedule(prev => {
      const slots = (prev[dayIdx]?.slots ?? []).filter((_, i) => i !== slotIdx);
      return { ...prev, [dayIdx]: { ...prev[dayIdx], slots } };
    });
  };

  /** Format YYYY-MM-DD → "10 de mayo de 2026" for display. */
  function formatExceptionDate(date: string): string {
    try {
      // parse as local-noon to avoid TZ off-by-one shifts on the date label
      const [y, m, d] = date.split('-').map(Number);
      return new Date(y, (m ?? 1) - 1, d ?? 1, 12).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch {
      return date;
    }
  }

  function todayIso(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const addException = () => {
    if (!newExceptionDate) return;
    if (exceptions.some(e => e.date === newExceptionDate)) {
      toast({
        title: 'Esa fecha ya está bloqueada',
        description: 'Cada día puede aparecer una sola vez en la lista.',
        variant: 'destructive',
      });
      return;
    }
    if (newExceptionDate < todayIso()) {
      toast({
        title: 'Fecha en el pasado',
        description: 'Solo puedes bloquear días futuros.',
        variant: 'destructive',
      });
      return;
    }
    const next = [...exceptions, { date: newExceptionDate, available: false }];
    next.sort((a, b) => a.date.localeCompare(b.date));
    setExceptions(next);
    setNewExceptionDate('');
  };

  const removeException = (date: string) => {
    setExceptions(prev => prev.filter(e => e.date !== date));
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="max-w-2xl mx-auto pb-24 space-y-10 animate-[fadeUp_0.4s_ease]"
      style={{ animationFillMode: 'both' }}
    >
      {/* ── Page header ── */}
      <div className="space-y-1 pt-2">
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Mi Agenda</h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Define cuándo estás disponible para sesiones 1:1. Tus clientes sólo verán las horas libres en tiempo real.
        </p>
      </div>

      {/* ── Timezone ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
          <Globe className="w-3.5 h-3.5" />
          Zona Horaria
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 shadow-sm">
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="border-0 bg-secondary/40 rounded-xl h-11 text-[15px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz.value} value={tz.value} className="text-[14px]">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-muted-foreground mt-2.5">
            Todos los huecos se muestran al paciente adaptados a su propia zona horaria.
          </p>
        </div>
      </section>

      {/* ── Weekly schedule ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Disponibilidad Semanal
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden shadow-sm divide-y divide-border/30">
          {DAYS_OF_WEEK.map((dayName, idx) => {
            const day = weeklySchedule[idx] ?? { active: false, slots: [] };

            return (
              <div
                key={idx}
                className={`transition-colors duration-200 ${day.active ? 'bg-transparent' : 'bg-secondary/10'}`}
              >
                {/* Day row header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <span
                    className={`text-[15px] font-medium transition-colors ${day.active ? 'text-foreground' : 'text-muted-foreground/60'}`}
                  >
                    {dayName}
                  </span>
                  <div className="flex items-center gap-3">
                    {!day.active && (
                      <span className="text-[12px] text-muted-foreground/50">No disponible</span>
                    )}
                    <Switch
                      checked={day.active}
                      onCheckedChange={checked => toggleDay(idx, checked)}
                    />
                  </div>
                </div>

                {/* Slots (only when active) */}
                {day.active && (
                  <div className="px-5 pb-4 space-y-2.5">
                    {(day.slots ?? []).map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        {/* Start */}
                        <input
                          type="time"
                          value={slot.start}
                          onChange={e => updateSlot(idx, sIdx, 'start', e.target.value)}
                          className="h-10 w-28 rounded-xl border border-border/50 bg-secondary/30 px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        />
                        <span className="text-muted-foreground text-sm">→</span>
                        {/* End */}
                        <input
                          type="time"
                          value={slot.end}
                          onChange={e => updateSlot(idx, sIdx, 'end', e.target.value)}
                          className="h-10 w-28 rounded-xl border border-border/50 bg-secondary/30 px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        />
                        <button
                          onClick={() => removeSlot(idx, sIdx)}
                          className="ml-1 p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addSlot(idx)}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Añadir intervalo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Vacation / blocked dates ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
          <CalendarOff className="w-3.5 h-3.5" />
          Vacaciones y días bloqueados
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-5 shadow-sm space-y-4">
          <p className="text-[12px] text-muted-foreground">
            Bloquea días concretos en los que no quieres recibir reservas (vacaciones, festivos, viajes).
            Aparecerán como no disponibles para los pacientes aunque tu horario semanal lo permita.
          </p>

          {/* Add new */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newExceptionDate}
              min={todayIso()}
              onChange={e => setNewExceptionDate(e.target.value)}
              className="h-10 rounded-xl border border-border/50 bg-secondary/30 px-3 text-[14px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition flex-1 max-w-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addException}
              disabled={!newExceptionDate}
              className="rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Bloquear día
            </Button>
          </div>

          {/* List */}
          {exceptions.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/70 italic pt-2">
              Sin días bloqueados. Tu horario semanal aplica todos los días.
            </p>
          ) : (
            <ul className="divide-y divide-border/30 -mx-1">
              {exceptions.map((exc) => (
                <li
                  key={exc.date}
                  className="flex items-center justify-between px-1 py-2.5"
                >
                  <span className="text-[14px] text-foreground capitalize">
                    {formatExceptionDate(exc.date)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeException(exc.date)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Quitar bloqueo del ${exc.date}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Save bar (sticky bottom) ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`
            h-12 px-8 rounded-full shadow-xl font-medium text-[15px] transition-all duration-300
            ${saved ? 'bg-green-500 hover:bg-green-500' : 'ios-button'}
          `}
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saved && <CheckCircle className="w-4 h-4 mr-2" />}
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar disponibilidad'}
        </Button>
      </div>
    </div>
  );
}
