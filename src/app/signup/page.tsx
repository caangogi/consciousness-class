'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import React from 'react';

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

  function onSubmit(values: SignupFormValues) {
    // TODO: Implement Firebase signup logic
    console.log(values);
    // Consider role selection or default to student
    // router.push('/dashboard/student'); // Example redirect
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Crea tu Cuenta</CardTitle>
          <CardDescription>Únete a consciousness-class y comienza tu viaje de aprendizaje.</CardDescription>
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
                        <Input placeholder="Tu nombre" {...field} />
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
                        <Input placeholder="Tu apellido" {...field} />
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
                      <Input type="email" placeholder="tu@email.com" {...field} />
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
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
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
                      <Input placeholder="Ingresa código de referido" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
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
