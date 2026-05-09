'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
  /** Copy shown above the form — communicates the value of logging in */
  ctaContext?: string;
}

export function AuthModal({ onSuccess, onClose, ctaContext }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (e: any) {
      const friendly: Record<string, string> = {
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/email-already-in-use': 'Ya existe una cuenta con este email.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/user-not-found': 'No encontramos esta cuenta.',
      };
      setError(friendly[e.code] || e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-background rounded-t-[32px] sm:rounded-[28px] border border-border/50 shadow-2xl overflow-hidden">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-title2 font-bold text-foreground">
                {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
              </h2>
              {ctaContext && (
                <p className="text-sm text-muted-foreground mt-1">{ctaContext}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors -mr-2 -mt-2"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Google CTA */}
          <Button
            onClick={handleGoogle}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 rounded-2xl font-medium gap-3 border-border/60 hover:bg-secondary/50 mb-4"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continuar con Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o con email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <Input
                placeholder="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-12 rounded-2xl"
                required
              />
            )}
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-2xl"
              required
            />
            <Input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 rounded-2xl"
              required
              minLength={6}
            />

            {error && <p className="text-sm text-destructive px-1">{error}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-2xl ios-button text-base mt-2"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : null}
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta gratis'}
            </Button>
          </form>

          {/* Toggle & Forgot */}
          <div className="mt-5 text-center space-y-2">
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-sm text-brand-chambray hover:underline"
            >
              {mode === 'login' ? '¿No tienes cuenta? Crea una gratis' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
            {mode === 'login' && (
              <div>
                <button
                  type="button"
                  onClick={() => email && sendPasswordResetEmail(auth, email)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
