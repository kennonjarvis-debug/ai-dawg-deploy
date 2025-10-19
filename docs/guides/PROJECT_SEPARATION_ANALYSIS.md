# JARVIS vs DAWG AI - Project Separation Analysis

**Analysis Date:** 2025-10-19
**Current Location:** `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy`

---

## ⚠️ PROBLEM: Mixed Project Identity

Your **DAWG AI** project contains **JARVIS** remnants that need to be removed or separated.

---

## 🔍 Contamination Found

### 1. **package.json** - Wrong Project Identity

**Location:** `/package.json`

**Issues:**
```json
{
  "name": "ai-dawg",                    // ✅ Correct (DAWG AI)
  "description": "AI-powered Digital Audio Workstation - Core Audio Engine",  // ✅ Correct

  // ❌ WRONG - Jarvis branding
  "build": {
    "appId": "com.jarvis.desktop",      // Should be: com.dawg-ai.desktop
    "productName": "Jarvis Desktop",     // Should be: DAWG AI Desktop
    "copyright": "Copyright © 2025 Jarvis"  // Should be: Copyright © 2025 DAWG AI
  },

  // ❌ BROKEN - Script references non-existent file
  "scripts": {
    "jit:controller": "tsx src/jarvis/jit-controller.ts"  // File doesn't exist!
  }
}
```

---

### 2. **Jarvis Components in DAWG AI**

**Files contaminating DAWG AI:**

```
src/components/JarvisPanel.tsx                    # 198 lines - Jarvis AI panel
src/frontend/components/JarvisAIChat.tsx          # Jarvis chat component
src/styles/jarvis-panel.css                       # Jarvis styles
public/openapi-jarvis.yaml                        # Jarvis OpenAPI spec
```

**Purpose Analysis:**

**JarvisPanel.tsx** - Proactive AI assistant panel
- Fetches "vitality" data
- Shows recommendations
- Displays pending actions
- Auto-refreshes every 30s

**Question:** Is this supposed to be:
1. Part of DAWG AI (rename to "AI Assistant Panel")
2. Part of separate JARVIS project (extract to separate repo)
3. Old code to delete

---

### 3. **Broken References**

**package.json Line 61:**
```json
"jit:controller": "tsx src/jarvis/jit-controller.ts"
```

**Error:** `src/jarvis/` directory doesn't exist!

**Impact:** Running `npm run jit:controller` will fail

---

### 4. **Naming Confusion Throughout**

**Files mentioning both names:**

- `INTEGRATION_OVERVIEW.md` (just created) - Mentions "JARVIS & DAWG AI"
- `src/modules/` - Several modules mention "Jarvis" in comments
- Module loader references "Jarvis"

---

## 🎯 What SHOULD Exist

### Option A: DAWG AI Only (Recommended if Jarvis is dead)

**Clean DAWG AI Project:**
```
ai-dawg-deploy/
├── package.json
│   ├── name: "ai-dawg"
│   ├── appId: "com.dawg-ai.desktop"
│   ├── productName: "DAWG AI Desktop"
│   └── NO Jarvis references
├── src/
│   ├── components/
│   │   └── AIAssistantPanel.tsx       (renamed from JarvisPanel)
│   └── NO jarvis/ directory
└── public/
    └── openapi-dawg-ai.yaml            (renamed from openapi-jarvis.yaml)
```

### Option B: Two Separate Projects (If Jarvis is active)

**DAWG AI Project** (Music Production DAW):
```
~/Projects/dawg-ai/
├── package.json (DAWG AI branding)
├── src/
│   ├── components/ (DAW interface)
│   ├── backend/ (Audio processing)
│   └── NO Jarvis code
└── Deployed to: dawg-ai.com
```

**JARVIS Project** (AI Assistant):
```
~/Projects/jarvis/
├── package.json (Jarvis branding)
├── src/
│   ├── jarvis/ (JIT controller)
│   ├── components/JarvisPanel.tsx
│   ├── modules/ (AI modules)
│   └── NO DAWG AI code
└── Deployed separately
```

---

## 📋 Files That Need Attention

### Files to DELETE (if Jarvis is dead):

```bash
src/components/JarvisPanel.tsx
src/frontend/components/JarvisAIChat.tsx
src/styles/jarvis-panel.css
public/openapi-jarvis.yaml
```

### Files to UPDATE (remove Jarvis references):

```bash
package.json                    # Fix build config, remove jit:controller script
INTEGRATION_OVERVIEW.md         # Remove Jarvis mentions
src/modules/module-loader.ts    # Remove Jarvis comments
src/modules/*/index.ts          # Check for Jarvis references
```

### package.json Changes Needed:

**Remove:**
```json
"jit:controller": "tsx src/jarvis/jit-controller.ts"
```

**Update:**
```json
"build": {
  "appId": "com.dawg-ai.desktop",
  "productName": "DAWG AI Desktop",
  "copyright": "Copyright © 2025 DAWG AI"
}
```

---

## 🤔 Questions to Answer

Before I can separate these projects, please clarify:

### 1. Is JARVIS a separate active project?
- **YES** → Create two separate repos
- **NO** → Clean DAWG AI, delete Jarvis remnants

### 2. What is JarvisPanel.tsx supposed to be?
- Part of DAWG AI's AI assistant (rename it)
- Part of separate Jarvis project (extract it)
- Old code to delete

### 3. What is src/jarvis/jit-controller.ts?
- Missing file that should exist
- Old reference that should be removed

### 4. Where should Jarvis live (if active)?
- Separate repo
- Subdirectory in ai-dawg-deploy
- Different project entirely

---

## ✅ Recommended Actions

### If JARVIS is DEAD (just DAWG AI):

**Step 1: Clean package.json**
```bash
# Remove Jarvis branding
# Remove jit:controller script
```

**Step 2: Decide on JarvisPanel**
```bash
# Option A: Rename to AIAssistantPanel.tsx (keep functionality)
# Option B: Delete entirely
```

**Step 3: Remove Jarvis files**
```bash
rm src/components/JarvisPanel.tsx
rm src/frontend/components/JarvisAIChat.tsx
rm src/styles/jarvis-panel.css
rm public/openapi-jarvis.yaml
```

**Step 4: Update branding**
```bash
# Update all "Jarvis Desktop" → "DAWG AI Desktop"
# Update appId: com.jarvis.desktop → com.dawg-ai.desktop
```

---

### If JARVIS is ALIVE (separate projects):

**Step 1: Create Jarvis repo**
```bash
mkdir ~/Projects/jarvis
cd ~/Projects/jarvis
git init
```

**Step 2: Extract Jarvis code from DAWG AI**
```bash
# Move these files to jarvis repo:
mv src/components/JarvisPanel.tsx → ~/Projects/jarvis/src/
mv src/frontend/components/JarvisAIChat.tsx → ~/Projects/jarvis/src/
mv src/styles/jarvis-panel.css → ~/Projects/jarvis/src/
mv public/openapi-jarvis.yaml → ~/Projects/jarvis/
# Create src/jarvis/jit-controller.ts in jarvis repo
```

**Step 3: Clean DAWG AI**
```bash
# Remove Jarvis references from package.json
# Update branding to "DAWG AI"
```

**Step 4: Set up integration (if needed)**
```bash
# If Jarvis needs to talk to DAWG AI:
# - Use REST API calls
# - Use WebSocket events
# - NO shared code
```

---

## 📊 Current State Summary

| Aspect | Current Reality | Should Be |
|--------|----------------|-----------|
| **Project Name** | ai-dawg | ✅ Correct |
| **appId** | com.jarvis.desktop | ❌ Wrong (com.dawg-ai.desktop) |
| **Product Name** | Jarvis Desktop | ❌ Wrong (DAWG AI Desktop) |
| **Jarvis Code** | Mixed into DAWG AI | ❌ Should be separated or removed |
| **jit:controller** | References missing file | ❌ Broken script |
| **Branding** | Confused (both names) | ❌ Should be one or the other |

---

## 🚨 Critical Issue

**Your Electron builds will be labeled wrong!**

When users install your app, they'll see:
- App name: "Jarvis Desktop" ❌ (should be "DAWG AI Desktop")
- Application ID: com.jarvis.desktop ❌ (should be com.dawg-ai.desktop)
- Copyright: "Copyright © 2025 Jarvis" ❌ (should be DAWG AI)

This is confusing and unprofessional.

---

## 💡 My Recommendation

Based on the codebase analysis, I recommend:

### **Option: Clean Separation**

**DAWG AI = Music Production DAW** (this repo)
- All audio/DAW functionality
- Music generation
- AI mixing/mastering
- Current domain: dawg-ai.com
- **No Jarvis branding**

**If Jarvis exists separately:**
- Extract to separate repo
- JarvisPanel becomes AI module system
- Can call DAWG AI APIs if needed
- Separate domain/deployment

**If Jarvis is dead:**
- Delete all Jarvis files
- Update branding to DAWG AI
- Rename components if keeping functionality

---

## 🎬 Next Steps

**Tell me which scenario:**

1. **"Jarvis is dead, clean DAWG AI"**
   - I'll remove all Jarvis references
   - Update package.json branding
   - Optionally rename JarvisPanel to AIAssistantPanel

2. **"Jarvis is separate, extract it"**
   - I'll create separation plan
   - Extract Jarvis code to new location
   - Clean DAWG AI of Jarvis references
   - Set up proper API boundaries

3. **"They should be the same project"**
   - I'll rename everything to be consistent
   - Decide on one name (DAWG AI or Jarvis)
   - Update all branding

**What do you want me to do?**
