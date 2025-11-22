import type { ReactNode } from 'react';

import AppFrame from '../AppFrame';

import '../globals.css';

export const dynamic = 'force-static';

type TestsLayoutProps = {
  children: ReactNode;
};

function TestsLayout({ children }: TestsLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

export default TestsLayout;
