import type { ReactNode } from 'react';

import Header from '../components/Header';
import Providers from './providers';

type AppFrameProps = {
  children: ReactNode;
};

function AppFrame({ children }: AppFrameProps) {
  return (
    <Providers>
      <Header />
      <main className="page">{children}</main>
    </Providers>
  );
}

export default AppFrame;
