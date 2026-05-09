'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, CheckCircle2, CreditCard, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { MiniStudioDialog } from '@/components/dashboard/courses/MiniStudioDialog';

export default function MembershipBuilderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('19');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [trialDays, setTrialDays] = useState('0');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Falta título', description: 'Debes darle un nombre a tu membresía.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      const res = await fetch('/api/creator/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ title, shortDescription: description, price: Number(price), billingInterval, trialDays: Number(trialDays), coverUrl })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Membresía creada', description: 'Tu membresía ya aparece en el catálogo.' });
        router.push('/dashboard/products');
      } else throw new Error(data.error);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="ios-button h-10 w-10 p-0 rounded-full">
            <Link href="/dashboard/products"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-largeTitle font-bold text-foreground">Nueva Membresía</h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="ios-button rounded-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Membresía
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold">Detalles de la Membresía</CardTitle>
              <CardDescription>Define los beneficios y condiciones de acceso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Nombre de la Membresía</label>
                <input value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Ej. Club Holístico Premium" />
              </div>
              <div className="space-y-2">
                <label className="text-subheadline font-medium">Descripción de los Beneficios</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full min-h-[120px] p-4 rounded-xl border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" placeholder="¿Qué recibirán los miembros? Sesiones en vivo mensuales, acceso a todos los cursos..." />
              </div>
            </CardContent>
          </Card>

          {/* Billing Card */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-title3 font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-chambray" /> Facturación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                {(['monthly', 'yearly'] as const).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setBillingInterval(interval)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${billingInterval === interval ? 'border-brand-chambray bg-brand-chambray/10 text-brand-chambray' : 'border-border text-muted-foreground hover:border-border/80'}`}
                  >
                    {interval === 'monthly' ? '📅 Mensual' : '📆 Anual (descuento)'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-subheadline font-medium">Precio ({billingInterval === 'monthly' ? 'mes' : 'año'})</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="19" />
                </div>
                <div className="space-y-2">
                  <label className="text-subheadline font-medium flex items-center gap-1"><Calendar className="w-4 h-4" /> Días de prueba gratuita</label>
                  <input value={trialDays} onChange={e => setTrialDays(e.target.value)} type="number" className="w-full h-11 px-4 rounded-xl border border-input bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="0" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cover Sidebar */}
        <div className="col-span-1">
          <Card className="shadow-sm border-border/50 sticky top-24">
            <CardHeader><CardTitle className="text-title3 font-semibold">Portada</CardTitle></CardHeader>
            <CardContent>
              <div className="relative rounded-[18px] aspect-[9/16] overflow-hidden border-2 border-dashed border-border bg-secondary/10 flex flex-col items-center justify-center">
                {coverUrl && <img src={coverUrl} alt="cover" className="w-full h-full object-cover absolute inset-0" />}
                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 transition-all ${coverUrl ? 'opacity-0 hover:opacity-100 bg-black/60 backdrop-blur-sm' : 'opacity-100'}`}>
                  {!coverUrl && <><UploadCloud className="w-8 h-8 text-muted-foreground mb-2" /><p className="text-xs text-muted-foreground">Sin portada</p></>}
                  <MiniStudioDialog currentTitle={title || 'Membresía Premium'} onSuccess={setCoverUrl} triggerButton={
                    <Button variant="default" className="w-full ios-button h-10 text-sm"><Sparkles className="w-4 h-4 mr-2" /> Nano Banana</Button>
                  } />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
