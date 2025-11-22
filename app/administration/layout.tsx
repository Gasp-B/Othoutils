import type { ReactNode } from 'react';

import AppFrame from '../AppFrame';

import '../globals.css';

export const dynamic = 'force-static';

type AdministrationLayoutProps = {
  children: ReactNode;
};

function AdministrationLayout({ children }: AdministrationLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

export default AdministrationLayout;
