import type { ReactNode } from 'react';

import AppFrame from '../AppFrame';

import '../globals.css';

export const dynamic = 'force-static';

type ToolsLayoutProps = {
  children: ReactNode;
};

function ToolsLayout({ children }: ToolsLayoutProps) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}

export default ToolsLayout;
