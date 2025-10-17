/**
 * UI Infrastructure Demo Page
 *
 * Live demonstration of:
 * - Design tokens (@dawg-ai/design-tokens)
 * - UI events (theme, layout, notifications)
 * - Event bus integration
 */

import { UIInfrastructureDemo } from '@/components/examples/UIInfrastructureDemo';

// Import design tokens CSS
import '@dawg-ai/design-tokens/tokens.css';

export default function UIDemo() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, var(--color-neutral-100), var(--color-neutral-200))',
      padding: 'var(--spacing-8)',
    }}>
      <UIInfrastructureDemo />
    </main>
  );
}
