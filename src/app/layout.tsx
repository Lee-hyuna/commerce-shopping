import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata = { title: 'Commerce' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
