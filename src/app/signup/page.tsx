
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import React, { useEffect } from 'react'; 
import { auth } from '@/lib/firebase/config'; 
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation'; 

const signupSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido.' }),
  apellido: z.string().min(1, { message: 'El apellido es requerido.' }),
  email: z.string().email({ message: 'Por favor ingresa un email válido.' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
  referralCode: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); 

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      referralCode: '',
    },
  });

  useEffect(() => {
    const urlReferralCode = searchParams.get('ref');
    let finalReferralCode = '';

    if (urlReferralCode) {
      if (urlReferralCode.length > 3 && urlReferralCode.length < 50 && /^[a-zA-Z0-9-_]+$/.test(urlReferralCode)) {
        finalReferralCode = urlReferralCode;
        try {
          localStorage.setItem('referral_code', urlReferralCode); 
          console.log(`[SignupPage] Referral code "${urlReferralCode}" from URL used and saved to localStorage.`);
        } catch (error) {
          console.error("[SignupPage] Error saving referral code from URL to localStorage:", error);
        }
      } else {
         console.warn(`[SignupPage] Invalid referral code format in URL: "${urlReferralCode}".`);
      }
    } else {
      try {
        const storedReferralCode = localStorage.getItem('referral_code');
        if (storedReferralCode) {
          finalReferralCode = storedReferralCode;
          console.log(`[SignupPage] Referral code "${storedReferralCode}" from localStorage used.`);
        }
      } catch (error) {
        console.error("[SignupPage] Error reading referral code from localStorage:", error);
      }
    }

    if (finalReferralCode) {
      form.setValue('referralCode', finalReferralCode);
    }
  }, [searchParams, form]);

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${values.nombre} ${values.apellido}`,
      });

      const idToken = await user.getIdToken(true);

      const response = await fetch('/api/users/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          nombre: values.nombre,
          apellido: values.apellido,
          referralCode: values.referralCode || null, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details ? `${errorData.error}: ${errorData.details}` : errorData.error || 'Error al crear perfil de usuario en backend.');
      }
      
      toast({
        title: "¡Cuenta Creada!",
        description: "Tu cuenta ha sido creada exitosamente. Serás redirigido.",
      });

      try {
        localStorage.removeItem('referral_code');
        console.log("[SignupPage] Referral code removed from localStorage after successful registration.");
      } catch (error) {
        console.error("[SignupPage] Error removing referral code from localStorage:", error);
      }

      const redirectParam = searchParams.get('redirect');
      let postAuthRedirect = null;
      try {
        postAuthRedirect = localStorage.getItem('post_auth_redirect');
      } catch (e) {
         console.warn("Could not access localStorage for post_auth_redirect", e);
      }

      if (redirectParam) {
        router.push(redirectParam);
      } else if (postAuthRedirect) {
        router.push(postAuthRedirect);
      } else {
        router.push('/dashboard');
      }
      try {
         localStorage.removeItem('post_auth_redirect');
      } catch (e) {
         console.warn("Could not remove post_auth_redirect from localStorage", e);
      }


    } catch (error: any) {
      console.error("Error al crear cuenta:", error);
      let errorMessage = "Ocurrió un error al crear tu cuenta. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este correo electrónico ya está en uso. Por favor, utiliza otro.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es demasiado débil. Por favor, elige una más segura.";
      } else if (error.message) { 
        errorMessage = error.message;
      }
      
      toast({
        title: "Error al Crear Cuenta",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Crea tu Cuenta</CardTitle>
          <CardDescription>Únete a Consciousness Class y comienza tu viaje de aprendizaje.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                     <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="•••••••• (mín. 8 caracteres)" 
                          {...field} 
                          disabled={isLoading}
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? 'Ocultar' : 'Mostrar'} contraseña</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Referido (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa código de referido" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading || form.formState.isSubmitting}>
                {isLoading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    