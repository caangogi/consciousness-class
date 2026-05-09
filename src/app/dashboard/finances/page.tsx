'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, ArrowUpRight, ArrowDownLeft, Clock, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

export default function FinancesPage() {
  const { userRole } = useAuth();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (userRole === 'creator' || userRole === 'admin' || userRole === 'superadmin') {
      loadWalletData();
    }
  }, [userRole]);

  const loadWalletData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const res = await fetch('/api/finances/my-wallet', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setWallet(data.wallet);
        setTransactions(data.transactions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Superadmin might have an additional specific view later, but they also have their own wallet.
  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8">
      <div>
        <h1 className="text-largeTitle font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-brand-chambray" /> Panel Financiero
        </h1>
        <p className="text-secondary-foreground mt-1">
          {userRole === 'superadmin' ? 'Tu billetera (SuperAdmin)' : 'Gestiona tus ingresos y comisiones de referidos.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-brand-chambray bg-brand-chambray/5 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-chambray uppercase tracking-wider">
              Saldo Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold text-foreground">
                {formatCurrency(wallet?.availableBalance || 0, wallet?.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Retirable a tu cuenta bancaria.
            </p>
            <Button className="w-full mt-4 ios-button bg-brand-chambray hover:bg-brand-chambray/90">
              Solicitar Retiro (Payout)
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              En Garantía (Pendiente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-foreground/80">
                {formatCurrency(wallet?.pendingBalance || 0, wallet?.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" /> Faltan días de maduración para evitar chargebacks.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Retirado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-foreground/80">
                {formatCurrency(wallet?.totalWithdrawn || 0, wallet?.currency)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Histórico de liquidaciones exitosas.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-title2 font-bold mb-4">Últimos Movimientos</h2>
        <div className="bg-card rounded-2xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden p-2">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No hay movimientos en tu Ledger aún.
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {transactions.map((tx) => {
                const isIncome = tx.amount > 0;
                return (
                  <li key={tx.id} className="p-4 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {isIncome ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {tx.description || tx.type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> 
                          {new Date(tx.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), wallet?.currency)}
                      </p>
                      {tx.status === 'pending' ? (
                        <Badge variant="outline" className="text-[10px] mt-1 text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">PENDIENTE</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] mt-1 border-green-200 text-green-600 bg-green-50 dark:bg-green-950/30">LIQUIDADO</Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
