import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, UserCircle, Gift, Copy, Edit, Award } from "lucide-react";

// Placeholder data
const enrolledCourses = [
  { id: '1', title: 'Desarrollo Web Avanzado', progress: 75, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'web course' },
  { id: '2', title: 'Introducción al Machine Learning', progress: 40, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'ml course' },
  { id: '3', title: 'Fotografía Profesional', progress: 100, imageUrl: 'https://placehold.co/300x180.png', dataAiHint: 'photo course' },
];

const referralData = {
  code: 'MENTORSTUD123',
  successfulReferrals: 5,
  rewardsEarned: '$25.00 en créditos',
};

const certificates = [
    { id: 'cert1', courseTitle: 'Fotografía Profesional', dateAwarded: '2023-10-15', url: '#' },
];


export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Panel de Estudiante</h1>

      {/* My Courses Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Cursos</CardTitle>
          </div>
          <CardDescription>Continúa tu aprendizaje donde lo dejaste.</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map(course => (
                <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Image src={course.imageUrl} alt={course.title} width={300} height={180} className="w-full aspect-[16/10] object-cover" data-ai-hint={course.dataAiHint}/>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 truncate">{course.title}</h3>
                    <Progress value={course.progress} className="mb-2 h-2" />
                    <p className="text-xs text-muted-foreground mb-3">{course.progress}% completado</p>
                    <Button variant="default" size="sm" asChild className="w-full">
                      <Link href={`/learn/${course.id}/lesson-placeholder`}>Continuar Aprendiendo</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aún no te has inscrito a ningún curso. <Link href="/courses" className="text-primary hover:underline">Explora cursos</Link>.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCircle className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl font-headline">Mi Perfil</CardTitle>
            </div>
            <CardDescription>Gestiona tu información personal y configuración de cuenta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p><span className="font-semibold">Nombre:</span> John Doe</p> {/* Placeholder */}
            <p><span className="font-semibold">Email:</span> john.doe@example.com</p> {/* Placeholder */}
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card className="shadow-lg">
          <CardHeader>
             <div className="flex items-center gap-2">
                <Gift className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-headline">Mi Código de Referido</CardTitle>
            </div>
            <CardDescription>Comparte tu código y obtén recompensas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-md">
              <p className="text-lg font-mono text-primary flex-grow">{referralData.code}</p>
              <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(referralData.code)}>
                <Copy className="h-5 w-5" />
                <span className="sr-only">Copiar código</span>
              </Button>
            </div>
            <p><span className="font-semibold">Referidos Exitosos:</span> {referralData.successfulReferrals}</p>
            <p><span className="font-semibold">Recompensas Obtenidas:</span> {referralData.rewardsEarned}</p>
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
              <Link href="/dashboard/student/referrals-history">Ver historial de recompensas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Certificates Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-headline">Mis Certificados</CardTitle>
          </div>
          <CardDescription>Visualiza y descarga los certificados de los cursos completados.</CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length > 0 ? (
            <ul className="space-y-3">
              {certificates.map(cert => (
                <li key={cert.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-secondary/30">
                  <div>
                    <p className="font-semibold">{cert.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">Obtenido el: {cert.dateAwarded}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={cert.url} target="_blank" rel="noopener noreferrer">Ver Certificado</Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-muted-foreground">Aún no has obtenido ningún certificado. ¡Sigue aprendiendo!</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
