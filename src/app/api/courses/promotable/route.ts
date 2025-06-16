
// src/app/api/courses/promotable/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { CourseService } from '@/features/course/application/course.service';
import { FirebaseCourseRepository } from '@/features/course/infrastructure/repositories/firebase-course.repository';

export async function GET(request: NextRequest) {
  try {
    const courseRepository = new FirebaseCourseRepository();
    const courseService = new CourseService(courseRepository);

    const publicCourses = await courseService.getAllPublicCourses();
    
    const promotableCourses = publicCourses
      .filter(course => course.estado === 'publicado' && typeof course.comisionReferidoPorcentaje === 'number' && course.comisionReferidoPorcentaje > 0)
      .map(course => ({
        id: course.id,
        nombre: course.nombre,
        imagenPortadaUrl: course.imagenPortadaUrl,
        dataAiHintImagenPortada: course.dataAiHintImagenPortada,
        comisionReferidoPorcentaje: course.comisionReferidoPorcentaje,
        precio: course.precio, // Puede ser útil para el embajador
        categoria: course.categoria, // También útil
      }));

    return NextResponse.json({ courses: promotableCourses }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/courses/promotable:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching promotable courses.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Promotable Courses Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;

    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
