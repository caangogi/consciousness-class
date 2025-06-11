import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

interface LogoProps {
  useIconOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Logo({ useIconOnly = false, className, onClick }: LogoProps) {
  const content = (
    <>
      <GraduationCap className="h-7 w-7 md:h-8 md:w-8" />
      {!useIconOnly && <span className="ml-2 text-xl md:text-2xl font-bold">MentorBloom</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center text-primary font-headline ${className || ''}`}
        aria-label="MentorBloom Home"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href="/" className={`flex items-center text-primary font-headline ${className || ''}`} aria-label="MentorBloom Home">
      {content}
    </Link>
  );
}
