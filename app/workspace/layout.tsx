/**
 * Workspace Layout - UI Redesign Phase 1.4
 *
 * Wraps workspace with necessary providers and context.
 */

import { ReactNode } from 'react';
import { ModeProvider } from '@/src/contexts/ModeContext';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <ModeProvider>
      {children}
    </ModeProvider>
  );
}
