const fs = require('fs');

const srcFile = 'src/app/dashboard/courses/new/page.tsx';
const destFile = 'src/app/dashboard/courses/[id]/page.tsx';

let content = fs.readFileSync(srcFile, 'utf8');

// 1. Add useParams to imports
content = content.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter, useParams } from 'next/navigation';"
);

// 2. Add params and courseIdFromRoute inside the component
content = content.replace(
  "export default function NewCoursePage() {",
  `export default function ManageCoursePage() { // Renamed component
  const params = useParams(); // Get route parameters
  const courseIdFromRoute = typeof params.id === 'string' && params.id !== 'new' ? params.id : null;`
);

// 3. Update createdCourseId initialization
content = content.replace(
  "const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);",
  "const [createdCourseId, setCreatedCourseId] = useState<string | null>(courseIdFromRoute); // Initialize with ID from route"
);

// 4. Inject the useEffect that fetches the course on mount (because edit mode usually has an ID immediately!)
const fetchEffect = `
  useEffect(() => {
    // This effect now handles loading for editing existing courses
    if (courseIdFromRoute) {
      setCreatedCourseId(courseIdFromRoute); // Ensure createdCourseId is set for edit mode
      fetchCourseStructure(courseIdFromRoute);
    } else {
      // Reset for new course creation if navigating from an edited course to "new"
      setCreatedCourseId(null);
      setCourseDetails(null);
      setModules([]);
      setLessonsByModule({});
      formStep1.reset(); 
      // etc. for other forms and states
    }
  }, [courseIdFromRoute, fetchCourseStructure, formStep1]);

  const fetchLessonsForModule`;

content = content.replace("  const fetchLessonsForModule", fetchEffect);

// 5. One more logic redirect! When step1 saves, it redirects on create. If createdCourseId exists, it just updates.
// The new/page.tsx does this properly but let's make sure it's the exact same.
// Indeed, new/page.tsx already has: `const endpoint = createdCourseId ? \`/api/courses/update/\${createdCourseId}\` : '/api/courses/create';`

fs.writeFileSync(destFile, content, 'utf8');
console.log("Successfully mirrored new/page.tsx into [id]/page.tsx with useParams patch!");
