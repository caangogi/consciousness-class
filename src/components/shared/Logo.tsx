import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary font-headline">
      <GraduationCap className="h-8 w-8" />
      <span>consciousness-class</span>
    </Link>
  );
}
