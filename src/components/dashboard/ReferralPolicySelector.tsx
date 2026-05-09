'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { PlusCircle, Loader2 } from 'lucide-react';

interface ReferralPolicy {
  id: string;
  name: string;
  tier1Percentage: number;
  tier2Percentage: number;
}

interface ReferralPolicySelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ReferralPolicySelector({ value, onChange }: ReferralPolicySelectorProps) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<ReferralPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTier1, setNewTier1] = useState('');
  const [newTier2, setNewTier2] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPolicies();
    }
  }, [user]);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      const res = await fetch('/api/creator/referral-policies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !newTier1) return;
    
    try {
      setIsCreating(true);
      const token = await user?.getIdToken();
      const res = await fetch('/api/creator/referral-policies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newName,
          tier1Percentage: parseFloat(newTier1),
          tier2Percentage: newTier2 ? parseFloat(newTier2) : 0
        })
      });

      if (res.ok) {
        const newPolicy = await res.json();
        setPolicies(prev => [newPolicy, ...prev]);
        onChange(newPolicy.id);
        setIsModalOpen(false);
        // Reset form
        setNewName('');
        setNewTier1('');
        setNewTier2('');
      }
    } catch (error) {
      console.error('Error creating policy', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="h-10 px-3 py-2 bg-secondary/20 rounded-md animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-2 w-full max-w-sm">
      <Select value={value || "none"} onValueChange={(val) => onChange(val === "none" ? null : val)}>
        <SelectTrigger className="w-full bg-secondary/20 border-0 focus:ring-0">
          <SelectValue placeholder="Sin comisiones (0%)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin comisiones (0%)</SelectItem>
          {policies.map(p => (
            <SelectItem key={p.id} value={p.id}>
              {p.name} ({p.tier1Percentage}% + {p.tier2Percentage}%)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsModalOpen(true)}
        className="shrink-0 bg-secondary/20 hover:bg-secondary/40 text-secondary-foreground"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Nueva Política de Referidos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre (Ej. Black Friday)</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la política"
                className="bg-secondary/20 border-0 focus-visible:ring-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tier1">Tier 1 (%) *</Label>
                <Input
                  id="tier1"
                  type="number"
                  value={newTier1}
                  onChange={(e) => setNewTier1(e.target.value)}
                  placeholder="Ej: 30"
                  className="bg-secondary/20 border-0 focus-visible:ring-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tier2">Tier 2 (%)</Label>
                <Input
                  id="tier2"
                  type="number"
                  value={newTier2}
                  onChange={(e) => setNewTier2(e.target.value)}
                  placeholder="Ej: 10"
                  className="bg-secondary/20 border-0 focus-visible:ring-1"
                />
              </div>
            </div>
            <p className="text-xs text-secondary-foreground">
              * Tier 1 es el afiliado directo. Tier 2 es quien invitó al afiliado directo (Opcional).
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!newName || !newTier1 || isCreating} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear y Seleccionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
