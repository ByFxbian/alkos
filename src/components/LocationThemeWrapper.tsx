'use client';

import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  locationSlug: string;
};

export default function LocationThemeWrapper({ children, locationSlug }: Props) {
  const isRedTheme = locationSlug === 'baden';

  if (!isRedTheme) {
    return <>{children}</>;
  }

  return (
    <div
      style={
        {
          '--color-gold-500': '#ef4444',
          '--color-gold-400': '#f87171',
        } as React.CSSProperties
      }
      className="contents"
    >
      {children}
    </div>
  );
}
