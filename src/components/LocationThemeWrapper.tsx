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
          '--color-gold-500': '#facc15',
          '--color-gold-400': '#fde047',
        } as React.CSSProperties
      }
      className="contents"
    >
      {children}
    </div>
  );
}
