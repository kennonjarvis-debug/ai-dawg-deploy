# @dawg-ai/design-tokens

Design tokens with TypeScript types for DAWG AI.

## Overview

This package provides a type-safe design token system with automatic CSS variable generation. All tokens are strictly typed using Zod schemas and can be validated at runtime.

## Installation

```bash
npm install @dawg-ai/design-tokens
```

## Usage

### Import CSS Variables

```typescript
import '@dawg-ai/design-tokens/tokens.css';
```

### Use in CSS

```css
.button {
  background: var(--color-primary-500);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-out);
}
```

### Use in TypeScript

```typescript
import { designTokens } from '@dawg-ai/design-tokens';

const primaryColor = designTokens.colors.primary[500]; // '#0ea5e9'
const spacing = designTokens.spacing[4]; // '1rem'
```

### Validate Tokens

```typescript
import { validateDesignTokens } from '@dawg-ai/design-tokens';

try {
  const validTokens = validateDesignTokens(myTokens);
  console.log('✅ Tokens are valid');
} catch (error) {
  console.error('❌ Invalid tokens:', error);
}
```

## Token Categories

### Colors

**Primary, Secondary, Accent, Neutral** (11 shades: 50-950)
```css
var(--color-primary-50)     /* Lightest */
var(--color-primary-500)    /* Base */
var(--color-primary-950)    /* Darkest */
```

**Semantic Colors**
```css
var(--color-success)
var(--color-warning)
var(--color-error)
var(--color-info)
```

### Spacing

0-128 with rem-based scaling
```css
var(--spacing-0)    /* 0px */
var(--spacing-4)    /* 1rem / 16px */
var(--spacing-8)    /* 2rem / 32px */
var(--spacing-16)   /* 4rem / 64px */
```

### Typography

**Font Families**
```css
var(--font-sans)
var(--font-serif)
var(--font-mono)
var(--font-display)
```

**Font Sizes**
```css
var(--text-xs)      /* 0.75rem */
var(--text-base)    /* 1rem */
var(--text-3xl)     /* 1.875rem */
```

**Font Weights**
```css
var(--font-weight-normal)    /* 400 */
var(--font-weight-medium)    /* 500 */
var(--font-weight-bold)      /* 700 */
```

**Line Heights**
```css
var(--leading-tight)
var(--leading-normal)
var(--leading-loose)
```

**Letter Spacing**
```css
var(--tracking-tight)
var(--tracking-normal)
var(--tracking-wide)
```

### Shadows

```css
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)
var(--shadow-2xl)
var(--shadow-inner)
```

### Animations

**Durations**
```css
var(--duration-instant)    /* 0ms */
var(--duration-fast)       /* 150ms */
var(--duration-normal)     /* 300ms */
var(--duration-slow)       /* 500ms */
```

**Easing**
```css
var(--ease-linear)
var(--ease-in)
var(--ease-out)
var(--ease-in-out)
var(--ease-bounce)
```

### Radius

```css
var(--radius-none)
var(--radius-sm)
var(--radius-base)
var(--radius-lg)
var(--radius-full)
```

### Breakpoints

```css
var(--breakpoint-xs)    /* 320px */
var(--breakpoint-sm)    /* 640px */
var(--breakpoint-md)    /* 768px */
var(--breakpoint-lg)    /* 1024px */
var(--breakpoint-xl)    /* 1280px */
var(--breakpoint-2xl)   /* 1536px */
```

### Z-Index

```css
var(--z-base)           /* 0 */
var(--z-dropdown)       /* 1000 */
var(--z-modal)          /* 1050 */
var(--z-notification)   /* 1080 */
```

## Development

### Build

```bash
npm run build
```

This will:
1. Compile TypeScript types
2. Generate `dist/tokens.css` from tokens

### Validate

```bash
npm run validate
```

Type-check tokens without building.

### Clean

```bash
npm run clean
```

Remove `dist/` directory.

## Type Safety

All tokens are strictly typed with Zod schemas:

```typescript
import { DesignTokens, validateDesignTokens } from '@dawg-ai/design-tokens';

const tokens: DesignTokens = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
  // ... all required token categories
};

// Runtime validation
const validated = validateDesignTokens(tokens);
```

## CI Integration

The package includes CI validation:

```yaml
- name: Validate design tokens
  run: npm run validate --workspace=@dawg-ai/design-tokens
```

This ensures tokens are always valid before merge.

## License

MIT
