
// src/app/api/student/my-courses/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { CourseProperties } from '@/features/course/domain/entities/course.entity';
import type { UserCourseProgressProperties } from '@/features/progress/domain/entities/user-course-progress.entity';

interface EnrolledCourseDetails extends CourseProperties {
  progress?: UserCourseProgressProperties;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token format' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying ID token in /api/student/my-courses:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token', details: error.message }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // 1. Get user document to find enrolled course IDs
    const userDocRef = adminDb.collection('usuarios').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    const userData = userDocSnap.data();
    const enrolledCourseIds: string[] = userData?.cursosInscritos || [];

    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ enrolledCourses: [] }, { status: 200 });
    }

    // 2. Fetch details for each enrolled course
    const coursePromises = enrolledCourseIds.map(courseId => 
      adminDb.collection('cursos').doc(courseId).get()
    );
    const courseSnapshots = await Promise.all(coursePromises);

    // 3. Fetch progress for each enrolled course
    const progressPromises = enrolledCourseIds.map(courseId =>
      userDocRef.collection('progresoCursos').doc(courseId).get()
    );
    const progressSnapshots = await Promise.all(progressPromises);

    // 4. Combine course details with progress
    const enrolledCourses: EnrolledCourseDetails[] = [];
    courseSnapshots.forEach((courseSnap, index) => {
      if (courseSnap.exists) {
        const courseData = courseSnap.data() as CourseProperties;
        const progressSnap = progressSnapshots[index];
        let courseWithProgress: EnrolledCourseDetails = { ...courseData };
        if (progressSnap.exists) {
          courseWithProgress.progress = progressSnap.data() as UserCourseProgressProperties;
        } else {
          // If no progress document, assume 0% progress
          courseWithProgress.progress = {
            userId: userId,
            courseId: courseData.id,
            lessonIdsCompletadas: [],
            porcentajeCompletado: 0,
            fechaUltimaActualizacion: new Date().toISOString(),
          };
        }
        enrolledCourses.push(courseWithProgress);
      } else {
        console.warn(`Course with ID ${enrolledCourseIds[index]} not found, but user ${userId} is enrolled.`);
      }
    });
    
    // Sort courses, e.g., by name or last updated progress (optional)
    // For now, keeping the order from cursosInscritos

    return NextResponse.json({ enrolledCourses }, { status: 200 });

  } catch (error: any) {
    console.error('Error in GET /api/student/my-courses:', error);
    let errorMessage = 'Internal Server Error';
    let errorDetails = 'An unexpected error occurred while fetching enrolled courses.';
    
    if (error instanceof Error) {
      errorDetails = error.message;
      errorMessage = error.name === 'Error' ? 'Enrolled Courses Fetch Error' : error.name;
    }
    
    const stack = process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined;
    return NextResponse.json({ error: errorMessage, details: errorDetails, stack }, { status: 500 });
  }
}
