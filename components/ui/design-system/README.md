# DAWG AI Design System

A comprehensive, accessible design system for DAWG AI with a dark glassmorphic aesthetic.

## 🎨 Overview

The DAWG AI design system provides:
- **Consolidated design tokens** (colors, spacing, typography, shadows, animations)
- **Core primitive components** (Button, Card, Input, Modal, Layout, Sidebar)
- **Responsive grid system** (mobile-first, 12-column)
- **Accessibility features** (ARIA labels, keyboard navigation, focus management)
- **Dark glassmorphic theme** with neon accents

## 📁 Structure

```
components/ui/design-system/
├── tokens.css          # Design tokens (CSS variables)
├── utils.css           # Utility classes (glass effects, animations)
├── grid.css            # Responsive grid system
├── Button.tsx          # Button primitive
├── Card.tsx            # Card primitive
├── Input.tsx           # Input/Textarea primitives
├── Modal.tsx           # Modal primitive
├── Layout.tsx          # Layout primitives
├── Sidebar.tsx         # Sidebar primitive
├── index.ts            # Main export file
└── README.md           # This file
```

## 🚀 Usage

### Importing Components

```tsx
import { Button, Card, Input, Modal, Layout, Sidebar } from '@/components/ui/design-system';
```

### Button Examples

```tsx
// Default glass button
<Button>Click me</Button>

// Primary button with icon
<Button variant="primary" icon={<SaveIcon />}>
  Save Project
</Button>

// Danger button
<Button variant="danger" size="sm">
  Delete
</Button>

// Icon-only button
<IconButton
  icon={<PlayIcon />}
  aria-label="Play track"
  variant="success"
/>
```

**Button Variants:**
- `default` - Glass effect with blue glow on hover
- `primary` - Neon blue border with prominent glow
- `secondary` - Glass panel with purple accent
- `danger` - Red border and glow
- `success` - Green border and glow
- `ghost` - Transparent, minimal styling

**Button Sizes:**
- `xs` - 6px height, 12px text
- `sm` - 8px height, 14px text
- `md` - 10px height, 16px text (default)
- `lg` - 12px height, 18px text
- `xl` - 14px height, 20px text

### Card Examples

```tsx
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Track Settings</CardTitle>
    <CardDescription>Configure your track parameters</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Your content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>

// Hoverable card
<Card variant="glass-heavy" hover>
  <p>Click me!</p>
</Card>
```

**Card Variants:**
- `default` / `glass` - Light glass effect
- `glass-panel` - Medium glass with panel background
- `glass-heavy` - Heavy glass with strong blur
- `dark` - Dark glass panel

**Card Padding:**
- `none`, `sm`, `md` (default), `lg`, `xl`

### Input Examples

```tsx
// Basic input
<Input
  label="Track Name"
  placeholder="Enter name..."
/>

// Input with icons
<Input
  leftIcon={<SearchIcon />}
  rightIcon={<ClearIcon />}
  placeholder="Search tracks..."
/>

// Input with error
<Input
  label="BPM"
  error="Must be between 40-240"
/>

// Textarea
<Textarea
  label="Description"
  rows={4}
  helperText="Add a description for this project"
/>
```

**Input Variants:**
- `default` - Transparent with border
- `filled` - Filled background
- `glass` - Glass effect

**Input Sizes:**
- `sm` - 8px height
- `md` - 10px height (default)
- `lg` - 12px height

### Modal Examples

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Export Project"
  description="Choose export settings"
  size="md"
>
  <p>Modal content here</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleExport}>
      Export
    </Button>
  </ModalFooter>
</Modal>
```

**Modal Sizes:**
- `sm` - max-width 448px
- `md` - max-width 512px (default)
- `lg` - max-width 768px
- `xl` - max-width 1024px
- `full` - max-width 95vw

**Modal Features:**
- Escape key to close
- Click overlay to close
- Focus trap
- Body scroll lock
- Accessible (ARIA)

### Layout Examples

```tsx
// Full application layout
<Layout
  header={
    <LayoutHeader
      logo={<Logo />}
      actions={<UserMenu />}
    >
      <ProjectSelector />
    </LayoutHeader>
  }
  sidebar={
    <Sidebar>
      <SidebarNav>
        <SidebarNavItem icon={<HomeIcon />} isActive>
          Home
        </SidebarNavItem>
        <SidebarNavItem icon={<TracksIcon />}>
          Tracks
        </SidebarNavItem>
      </SidebarNav>
    </Sidebar>
  }
  footer={<TransportControls />}
>
  <LayoutContent maxWidth="xl">
    {/* Your page content */}
  </LayoutContent>
</Layout>

// Responsive grid
<LayoutGrid cols={3} gap="md">
  <Card>Widget 1</Card>
  <Card>Widget 2</Card>
  <Card>Widget 3</Card>
</LayoutGrid>

// Section with title
<LayoutSection
  title="Recent Projects"
  description="Your most recent work"
  action={<Button>View All</Button>}
>
  {/* Section content */}
</LayoutSection>
```

**Layout Features:**
- Overflow handling (min-h-0, overflow-y-auto)
- Responsive breakpoints
- Flexible header/sidebar/footer
- Custom scrollbar styling

### Sidebar Examples

```tsx
// Collapsible sidebar
<Sidebar
  collapsible
  defaultCollapsed={false}
  width="280px"
  collapsedWidth="64px"
  header={<h2>Navigation</h2>}
  footer={<UserProfile />}
>
  <SidebarNav>
    <SidebarSection title="Main">
      <SidebarNavItem icon={<DashboardIcon />} isActive>
        Dashboard
      </SidebarNavItem>
      <SidebarNavItem icon={<ProjectsIcon />}>
        Projects
      </SidebarNavItem>
    </SidebarSection>
  </SidebarNav>
</Sidebar>
```

**Sidebar Features:**
- Collapsible on desktop
- Mobile drawer on small screens
- Keyboard shortcuts (Escape to close)
- Smooth animations

## 🎨 Design Tokens

All design tokens are CSS variables defined in `tokens.css`:

### Colors
```css
--text-primary: #ffffff
--text-secondary: #a0a0a0
--text-tertiary: #666666

--bg-primary: #0a0a0a
--bg-secondary: #141414
--bg-tertiary: #1a1a1a

--accent-blue: #00d4ff
--accent-purple: #b066ff
--accent-green: #00ff88
--accent-red: #ff2e4c
```

### Spacing
```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
```

### Typography
```css
--font-sans: 'Inter', -apple-system, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace

--text-xs: 0.75rem   /* 12px */
--text-sm: 0.875rem  /* 14px */
--text-base: 1rem    /* 16px */
--text-lg: 1.125rem  /* 18px */
--text-xl: 1.25rem   /* 20px */
```

### Border Radius
```css
--radius-sm: 0.25rem   /* 4px */
--radius-md: 0.375rem  /* 6px */
--radius-lg: 0.5rem    /* 8px */
--radius-xl: 0.75rem   /* 12px */
```

### Shadows & Glows
```css
--glow-blue-sm: 0 0 10px rgba(0, 212, 255, 0.3)
--glow-blue-md: 0 0 20px rgba(0, 212, 255, 0.5)
--glow-blue-lg: 0 0 40px rgba(0, 212, 255, 0.7)
```

## 🛠 Utility Classes

### Glass Effects
```css
.glass              /* Light glass effect */
.glass-panel        /* Medium glass panel */
.glass-heavy        /* Heavy glass with strong blur */
.glass-dark         /* Dark glass panel */
```

### Neon Borders
```css
.neon-border-blue
.neon-border-purple
.neon-border-green
.neon-border-red
```

### Glows
```css
.glow-blue
.glow-purple
.glow-green
.glow-red

.hover-glow-blue
.hover-glow-purple
.hover-glow-green
.hover-glow-red
```

### Animations
```css
.animate-pulse
.animate-pulse-glow
.animate-ripple
.animate-shimmer
.animate-fade-in
.animate-fade-out
```

### Layout Utilities
```css
.overflow-container
.flex-shrink-none
.max-h-screen
.custom-scrollbar
.separator-vertical
.separator-horizontal
```

## 📱 Responsive Grid

Mobile-first 12-column grid system:

```tsx
// Grid with responsive columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

// Span multiple columns
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-8 lg:col-span-9">Main</div>
  <div className="col-span-12 md:col-span-4 lg:col-span-3">Sidebar</div>
</div>
```

**Breakpoints:**
- `xs`: 390px (mobile)
- `sm`: 640px (small tablet)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1920px (extra large)

## ♿️ Accessibility

All components follow WCAG 2.1 AA standards:

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper ARIA attributes
- **Focus Management**: Visible focus states
- **Screen Readers**: Semantic HTML and ARIA
- **Color Contrast**: 4.5:1 minimum ratio

### Focus Ring
All interactive elements have a consistent focus ring:
```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-blue);
}
```

## 🎯 Best Practices

### Overflow Handling
Always use these patterns to prevent content cut-offs:

```tsx
// Container with scroll
<div className="flex flex-col min-h-0">
  <div className="flex-shrink-0">{/* Header */}</div>
  <div className="flex-1 overflow-y-auto">{/* Content */}</div>
  <div className="flex-shrink-0">{/* Footer */}</div>
</div>
```

### Mobile-First
Design for mobile, enhance for desktop:

```tsx
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</div>
```

### Performance
- Lazy load heavy components
- Use CSS transforms (not top/left) for animations
- Minimize re-renders with React.memo
- Target <100ms interactions

## 📚 Examples

See `/app/page.tsx` for real-world usage of the design system.

## 🔧 Customization

To customize the design system, edit the CSS variables in `tokens.css`:

```css
:root {
  /* Override any token */
  --accent-blue: #your-color;
  --space-4: your-spacing;
}
```

## 🐛 Troubleshooting

### Component not found
Make sure you're importing from the correct path:
```tsx
import { Button } from '@/components/ui/design-system';
```

### Styles not applying
Check that globals.css imports the design system:
```css
@import '../components/ui/design-system/tokens.css';
@import '../components/ui/design-system/utils.css';
@import '../components/ui/design-system/grid.css';
```

### TypeScript errors
Make sure all component props are correctly typed:
```tsx
import type { ButtonProps } from '@/components/ui/design-system';
```

## 📄 License

Part of DAWG AI - © 2025
