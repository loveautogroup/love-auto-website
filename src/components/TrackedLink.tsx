'use client';

import { trackPhoneClick, trackDirectionsClick } from '@/lib/analytics';

/**
 * Drop-in <a> replacement that fires a GA4 event on click.
 * Use in server components where you can't add onClick inline.
 */
export function TrackedPhoneLink({
  location,
  href,
  className,
  children,
  'aria-label': ariaLabel,
}: {
  location: string;
  href: string;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() => trackPhoneClick(location)}
    >
      {children}
    </a>
  );
}

export function TrackedDirectionsLink({
  href,
  className,
  children,
  target,
  rel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <a
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={() => trackDirectionsClick()}
    >
      {children}
    </a>
  );
}
