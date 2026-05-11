'use client';

import Link from 'next/link';
import { Instagram, Linkedin, Heart, Leaf } from 'lucide-react';
import { MedicalDisclaimer } from '@/components/safety/MedicalDisclaimer';

const NAV_COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: 'Plataforma',
    links: [
      { href: '/products', label: 'Catálogo' },
      { href: '/pricing', label: 'Precios' },
      { href: '/comunidad', label: 'Comunidad' },
      { href: '/manifesto', label: 'Manifesto' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/safety/help', label: 'Ayuda y crisis · 24/7' },
      { href: 'mailto:hello@consciousness.class', label: 'Contacto', external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Términos de servicio' },
      { href: '/privacy', label: 'Privacidad' },
    ],
  },
];

export function Footer(): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-secondary/30 mt-12">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Top: brand + 3 nav columns */}
        <div className="grid gap-8 md:gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-terracotta/15 text-brand-terracotta flex items-center justify-center">
                <Leaf className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Consciousness Class</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              La plataforma todo-en-uno para creadores holísticos. Tú pones la sabiduría — nosotros la infraestructura.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="https://www.instagram.com/consciousnessclass"
                aria-label="Instagram"
                className="h-9 w-9 rounded-full bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="https://www.linkedin.com/company/consciousnessclass"
                aria-label="LinkedIn"
                className="h-9 w-9 rounded-full bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex items-center justify-center"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-foreground/75 hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-foreground/75 hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Medical disclaimer banner — present site-wide for compliance baseline */}
        <div className="mt-10 pt-8 border-t border-border/40">
          <MedicalDisclaimer variant="banner" />
        </div>

        {/* Bottom: copyright + GDPR badge */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} Consciousness Class. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-brand-terracotta" aria-hidden="true" />
              Hecho con cuidado · datos en UE
            </span>
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-secondary/60">
              GDPR
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
