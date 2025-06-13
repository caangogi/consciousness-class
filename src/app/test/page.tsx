import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

// Server Action to test user document update in Firestore
async function testUserWrite() {
  'use server';
  try {
    await adminDb!.collection('usuarios').doc('65dn0cOL5gNfucSIoS6k4EqPJtT2').update({ _debug: true });
    console.log('✅ Usuario actualizado correctamente');
  } catch (err) {
    console.error('❌ Error al actualizar usuario:', err);
  }
}

// Server Action to test course document update in Firestore
async function testCourseWrite() {
  'use server';
  try {
    await adminDb!.collection('cursos').doc('d49781ac-e7f2-4c6b-a69a-c3695c202dcd').update({ _debugCount: FieldValue.increment(1) });
    console.log('✅ Curso actualizado correctamente');
  } catch (err) {
    console.error('❌ Error al actualizar curso:', err);
  }
}

// Client Component with two buttons to trigger the tests
export default function TestPage() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pruebas de Firestore</h1>
      <form action={testUserWrite} className="mb-4">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Probar actualización de usuario
        </button>
      </form>
      <form action={testCourseWrite}>
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
          Probar actualización de curso
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Reemplaza <code className="bg-gray-100 px-1 py-0.5 rounded">{'<REPLACE_WITH_USER_ID>'}</code> y <code className="bg-gray-100 px-1 py-0.5 rounded">{'<REPLACE_WITH_COURSE_ID>'}</code> con IDs válidos en este archivo antes de usar.
      </p>
    </div>
  );
}
