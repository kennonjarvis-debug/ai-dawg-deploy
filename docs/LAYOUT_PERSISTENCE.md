# Layout Persistence System

**Instance 4 (Data & Storage)** - Complete layout persistence for DAWG AI

## 🎯 What It Does

Saves and restores user's UI layout preferences:
- **Sidebar state:** Width, visibility, collapsed state
- **Content splits:** Tracks/waveform height percentages
- **Bottom widget grid:** Columns, height, widget positions
- **Widget visibility:** Show/hide individual widgets
- **Multiple layouts:** Save different workspace configurations

## 📦 Files Created

### Core System
```
lib/layout/LayoutManager.ts         # Layout state management class
src/hooks/useLayout.ts               # React hook for layout persistence
```

### API Endpoints
```
app/api/layouts/route.ts             # GET/POST layouts
app/api/layouts/[layoutId]/route.ts  # GET/DELETE specific layout
```

### UI Widget
```
src/widgets/LayoutManager/
  ├── LayoutManager.tsx              # Layout management UI
  └── LayoutManager.module.css       # Styles
```

## 🚀 Quick Start (Instance 1 Integration)

### 1. Add useLayout to page.tsx

```typescript
import { useLayout } from '@/src/hooks/useLayout';

export default function Home() {
  const {
    layout,
    saving,
    updateSidebar,
    updateMainContent
  } = useLayout();

  // Use layout state instead of local state
  const [showSidebar, setShowSidebar] = useState(layout?.sidebar.visible ?? true);

  // Update layout when sidebar changes
  const handleToggleSidebar = () => {
    const newValue = !showSidebar;
    setShowSidebar(newValue);
    updateSidebar({ visible: newValue });
  };

  // ... rest of component
}
```

### 2. Add LayoutManager Widget

```typescript
import { LayoutManager } from '@/src/widgets/LayoutManager/LayoutManager';

export default function Home() {
  const [showLayoutManager, setShowLayoutManager] = useState(false);

  return (
    <>
      {/* Add Layout button to header */}
      <button onClick={() => setShowLayoutManager(true)}>
        <Settings size={18} />
        Layouts
      </button>

      {/* Layout Manager Modal */}
      <LayoutManager
        isOpen={showLayoutManager}
        onClose={() => setShowLayoutManager(false)}
      />
    </>
  );
}
```

## 📋 Layout Schema

```typescript
interface UserLayout {
  userId: string;
  layoutId: string;
  name: string;              // e.g., "Recording Setup"
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Sidebar state
  sidebar: {
    visible: boolean;
    width: number;           // 200-500px
    collapsed: boolean;
  };

  // Main content split
  mainContent: {
    tracksHeight: number;    // percentage 0-100
    waveformHeight: number;  // percentage 0-100
  };

  // Bottom widget grid
  bottomWidgets: {
    columns: number;         // 4-6 columns
    height: number;          // 100-200px
    widgets: WidgetPosition[];
  };

  // Widget visibility toggles
  widgets: {
    compactPitchMonitor: boolean;
    compactEQ: boolean;
    projectStats: boolean;
    quickActions: boolean;
    voiceInterface: boolean;
    chatPanel: boolean;
    projectSelector: boolean;
  };
}
```

## 🔧 Hook API

### useLayout()

```typescript
const {
  // State
  layout,              // Current layout object
  layouts,             // All saved layouts
  loading,             // Loading state
  saving,              // Saving indicator

  // Methods
  updateLayout,        // Update any layout property
  updateSidebar,       // Update sidebar state
  updateMainContent,   // Update content split
  toggleWidget,        // Toggle widget visibility
  updateBottomWidgets, // Update bottom grid
  createLayout,        // Save new layout
  switchLayout,        // Switch to different layout
  deleteLayout,        // Delete layout
  exportLayout,        // Export to JSON
  importLayout,        // Import from JSON
  resetToDefault,      // Reset to default layout
} = useLayout();
```

### Example: Update Sidebar Width

```typescript
const { updateSidebar } = useLayout();

// User drags sidebar resize handle
const handleSidebarResize = (newWidth: number) => {
  updateSidebar({ width: newWidth });
};
```

### Example: Update Content Split

```typescript
const { updateMainContent } = useLayout();

// User drags splitter between tracks and waveform
const handleSplitChange = (tracksHeight: number) => {
  updateMainContent({
    tracksHeight,
    waveformHeight: 100 - tracksHeight
  });
};
```

### Example: Toggle Widget

```typescript
const { toggleWidget } = useLayout();

// User clicks hide/show button
const handleTogglePitchMonitor = () => {
  toggleWidget('compactPitchMonitor');
};
```

## 📡 API Endpoints

### GET /api/layouts
Get all layouts for current user

**Response:**
```json
{
  "success": true,
  "layouts": [
    {
      "layoutId": "layout_123",
      "name": "Recording Setup",
      "isDefault": true,
      "sidebar": { "visible": true, "width": 300 },
      // ... rest of layout
    }
  ]
}
```

### POST /api/layouts
Save/update layout

**Request:**
```json
{
  "layoutId": "layout_123",  // optional, creates new if omitted
  "name": "My Layout",
  "sidebar": { "width": 350 },
  // ... partial updates
}
```

**Response:**
```json
{
  "success": true,
  "layout": { /* full layout object */ }
}
```

### GET /api/layouts/[layoutId]
Get specific layout

### DELETE /api/layouts/[layoutId]
Delete layout

## 💾 Data Persistence

### Current: localStorage
```javascript
// Saved as: layouts_{userId}
localStorage.setItem('layouts_user@example.com', JSON.stringify(layouts));
```

### Future: Database (TODO)
```typescript
// Add to Prisma schema:
model Layout {
  id        String   @id @default(cuid())
  userId    String
  layoutId  String   @unique
  name      String
  data      Json     // Full layout object
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id])
}
```

## 🎨 UI Features

### LayoutManager Widget
- **Save As New:** Clone current layout with new name
- **Export:** Download layout as JSON file
- **Import:** Upload layout JSON file
- **Switch Layouts:** Quick switch between saved layouts
- **Delete Layouts:** Remove unused layouts
- **Reset to Default:** Restore default layout

### Auto-Save
- Debounced saving (500ms after last change)
- Visual indicator when saving
- No user action required

## 🔄 Integration Checklist

- [ ] Replace hardcoded layout state with `useLayout()` hook
- [ ] Connect sidebar toggle to `updateSidebar()`
- [ ] Connect splitter handles to `updateMainContent()`
- [ ] Add resize handles for sidebar (react-resizable or custom)
- [ ] Add LayoutManager button to header
- [ ] Test layout persistence across page reloads
- [ ] Test multiple layout switching
- [ ] Test export/import functionality

## 🚨 Known Limitations

1. **localStorage only** - No database persistence yet
2. **Single user** - No multi-device sync (needs auth + DB)
3. **No drag & drop** - Widgets in fixed grid positions
4. **No resize handles** - Need to add react-resizable or custom implementation

## 📝 Next Steps (Instance 1)

1. **Add resize handles:**
   ```bash
   npm install react-resizable-panels
   ```

2. **Replace hardcoded layout values:**
   ```typescript
   // Before:
   <div style={{ width: '300px' }}>

   // After:
   <div style={{ width: `${layout?.sidebar.width || 300}px` }}>
   ```

3. **Add LayoutManager to header:**
   ```typescript
   <button onClick={() => setShowLayoutManager(true)}>
     <Settings size={18} /> Layouts
   </button>
   ```

4. **Test persistence:**
   - Resize sidebar → reload page → verify width persisted
   - Create new layout → switch layouts → verify state changes
   - Export layout → import on different browser → verify works

## 🎯 Future Enhancements

- [ ] Database persistence (Prisma + PostgreSQL)
- [ ] Cloud sync across devices
- [ ] Drag & drop widget grid (react-grid-layout)
- [ ] Window positions for multi-monitor support
- [ ] Layout templates marketplace
- [ ] Keyboard shortcuts for layout switching
- [ ] Layout presets (Recording, Mixing, Mastering)

---

**Created by:** Instance 4 (Data & Storage)
**Status:** ✅ Complete - Ready for Instance 1 integration
**Dependencies:** NextAuth session, useSession hook
