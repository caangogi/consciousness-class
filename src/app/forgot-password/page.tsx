
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound } from 'lucide-react';
import React from 'react'; // Import React for useState
import { auth } from '@/lib/firebase/config'; // Import Firebase auth
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Por favor ingresa un email válido.' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsLoading(true);
    setIsEmailSent(false);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: "Correo Enviado",
        description: "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.",
      });
      setIsEmailSent(true);
      form.reset();
    } catch (error: any) {
      console.error("Error al enviar correo de restablecimiento:", error);
      let errorMessage = "Ocurrió un error. Inténtalo de nuevo.";
      if (error.code === 'auth/user-not-found') {
        // We generally don't want to reveal if an email exists or not for security reasons
        // So, show a generic message, same as success.
        toast({
            title: "Correo Enviado",
            description: "Si tu email está registrado, recibirás un enlace para restablecer tu contraseña.",
        });
        setIsEmailSent(true); 
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Restablecer Contraseña</CardTitle>
          <CardDescription>
            {isEmailSent 
              ? "Revisa tu bandeja de entrada (y spam) para el correo de restablecimiento."
              : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmailSent ? (
             <div className="text-center p-4 bg-green-100/50 text-green-700 rounded-md">
                <p>Se ha enviado el correo de restablecimiento. Por favor, sigue las instrucciones en el correo.</p>
             </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" className="w-full" disabled={isLoading || form.formState.isSubmitting}>
                  {isLoading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            {isEmailSent ? "¿Necesitas iniciar sesión?" : "¿Recordaste tu contraseña?"}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
