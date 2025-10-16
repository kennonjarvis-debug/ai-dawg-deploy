# AI DAW Production Testing Checklist

**URL:** https://www.dawg-ai.com
**Date:** 2025-10-16
**Version:** Demo Mode (index-BARa1d9D.js)

---

## Pre-Testing Setup

- [ ] Open browser in incognito/private mode (clean slate)
- [ ] Open Developer Console (F12 or Cmd+Option+I)
- [ ] Navigate to https://www.dawg-ai.com
- [ ] Verify HTTPS padlock is present and green
- [ ] Check Console tab for errors (should see "Running in demo mode" message)

---

## Critical: Zero Console Errors

### Page Load
- [ ] **No console.error messages** (except "Backend not available" warnings are OK)
- [ ] No red error messages in console
- [ ] No "Unexpected token '<'" errors
- [ ] No "Failed to parse JSON" errors
- [ ] No CSRF token errors
- [ ] No "Failed to load projects" errors
- [ ] No "Failed to load entitlements" errors

### Console Output Expected
✅ Should see:
- "Running in demo mode - backend authentication disabled"
- "Backend not available, using demo projects" (warning, not error)
- "Backend not available, using demo entitlements" (warning, not error)

❌ Should NOT see:
- Any JSON parsing errors
- Any 404 errors
- Any failed network requests for JS/CSS files
- Any TypeScript errors
- Any React errors

---

## Landing Page Tests

### Visual Check
- [ ] Page loads completely (no broken layout)
- [ ] Logo/branding displays correctly
- [ ] Hero section is visible
- [ ] Call-to-action buttons are visible
- [ ] Footer displays properly
- [ ] No broken images (404s)
- [ ] Fonts load correctly (not fallback fonts)

### Meta Tags (View Page Source)
- [ ] Title tag: "AI DAW - AI-Powered Digital Audio Workstation"
- [ ] Meta description present
- [ ] Open Graph tags present (og:title, og:description, og:image)
- [ ] Twitter card tags present
- [ ] Favicon loads (check browser tab)
- [ ] Manifest.json loads at /manifest.json

### Performance
- [ ] Page loads in <3 seconds
- [ ] No layout shift (CLS issues)
- [ ] Images load progressively
- [ ] Smooth scrolling

---

## Authentication Flow

### Sign In / Login
- [ ] Find and click "Sign In" or "Login" button
- [ ] Form appears without errors
- [ ] Enter email: test@example.com
- [ ] Enter password: anything (demo mode)
- [ ] Click "Sign In" button
- [ ] No console errors during sign in
- [ ] Should navigate to app or projects page
- [ ] Demo user created successfully

### Demo Mode Behavior
- [ ] Login works without real backend
- [ ] User is authenticated in demo mode
- [ ] Username/email displays in UI

---

## Projects Page Tests

### Page Load
- [ ] Projects page loads successfully
- [ ] "Projects" header visible
- [ ] User info displays (demo user name/email)
- [ ] Project count shows correctly
- [ ] Search bar visible
- [ ] "New Project" button visible
- [ ] Logout button visible (if authenticated)

### Demo Projects Display
- [ ] **Exactly 2 demo projects** visible:
  1. "Demo Song - Electronic Dance" (tempo: 128, key: C, 4/4)
  2. "Demo Song - Hip Hop Beat" (tempo: 90, key: Am, 4/4)
- [ ] Each project card shows:
  - Project name
  - Description
  - Created/Updated date
  - Settings (tempo, time signature, key)
- [ ] Project cards are clickable
- [ ] No loading spinners stuck

### Search Functionality
- [ ] Click in search box (data-testid="search-projects-input")
- [ ] Type "Demo"
- [ ] Both projects remain visible
- [ ] Type "Electronic"
- [ ] Only Electronic Dance project visible
- [ ] Clear search - both projects return
- [ ] No console errors during search

### Filter Button
- [ ] Click filter button (data-testid="filter-button")
- [ ] No console errors
- [ ] Filter UI appears or button is clickable

### New Project Button
- [ ] Click "New Project" button (data-testid="new-project-button")
- [ ] Modal appears OR navigation occurs
- [ ] No console errors
- [ ] Should not show limit modal (demo mode = PRO plan with 100 project limit)
- [ ] If modal opens, check for:
  - Project name field
  - Description field
  - Tempo setting
  - Time signature setting
  - Key setting
  - Create button
  - Cancel button

### Project Limit Modal (Edge Case)
Note: With demo PRO plan, limit is 100 projects, so this won't trigger
But if it does:
- [ ] Modal shows current plan (PRO)
- [ ] Modal shows max projects (100)
- [ ] "Close" button works (data-testid="close-limit-modal")
- [ ] "Upgrade Plan" link present (data-testid="upgrade-plan-link")
- [ ] No console errors

### Logout Button
- [ ] Click logout button (data-testid="logout-button")
- [ ] No console errors
- [ ] User logged out or redirected

---

## Navigation & Routing

### URL Navigation
- [ ] Type https://www.dawg-ai.com/ - works
- [ ] Type https://www.dawg-ai.com/app - works (or redirects appropriately)
- [ ] Type https://www.dawg-ai.com/pricing - works or shows pricing
- [ ] Browser back button works
- [ ] Browser forward button works
- [ ] Refresh page (Cmd+R) works without errors

### Deep Linking
- [ ] Copy URL, paste in new tab - same page loads
- [ ] URLs are shareable

---

## Mobile Responsiveness

### iPhone SE (375x667)
- [ ] Layout adapts to mobile
- [ ] No horizontal scrolling
- [ ] Buttons are tappable (not too small)
- [ ] Text is readable
- [ ] Navigation menu accessible
- [ ] Project cards stack vertically

### iPad (768x1024)
- [ ] Layout uses tablet breakpoint
- [ ] Project grid shows 2 columns
- [ ] Everything is accessible

### iPhone 13 (390x844)
- [ ] Modern mobile layout works
- [ ] All features accessible
- [ ] Touch targets are appropriately sized

**Test in Chrome DevTools:**
1. Open DevTools (F12)
2. Click device toolbar icon (Cmd+Shift+M)
3. Select device from dropdown
4. Test all features

---

## Cross-Browser Testing

### Chrome (Primary)
- [ ] All features work
- [ ] No console errors
- [ ] Performance good

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Styling consistent

### Safari
- [ ] All features work
- [ ] No console errors
- [ ] Webkit-specific features work

---

## Accessibility (A11y)

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals

### Screen Reader (Basic)
- [ ] Page has proper heading hierarchy (H1 → H2 → H3)
- [ ] Images have alt text
- [ ] Buttons have aria-labels or text
- [ ] Forms have proper labels

### Color Contrast
- [ ] Text is readable against backgrounds
- [ ] Buttons have sufficient contrast
- [ ] Links are distinguishable

---

## Network Requests

### Check Network Tab in DevTools
- [ ] All JS bundles load (200 status):
  - /assets/js/index-BARa1d9D.js
  - /assets/js/vendor-CBWSAkH9.js
- [ ] All CSS loads (200 status):
  - /assets/css/vendor-C0BCwPpi.css
  - /assets/css/index-YiCa3F_8.css
- [ ] Favicon loads: /assets/ai-dawg-logo.svg
- [ ] Manifest loads: /manifest.json
- [ ] No 404 errors for assets
- [ ] No failed requests (except /api/v1/* which are bypassed in demo mode)

### API Calls (Should be Bypassed)
- [ ] No calls to /api/v1/csrf-token
- [ ] No calls to /api/v1/auth/me
- [ ] No calls to /api/v1/projects
- [ ] No calls to /api/v1/entitlements
- [ ] If API calls exist, they should not cause errors

---

## Performance Metrics

### Lighthouse Audit (Chrome DevTools)
Run Lighthouse audit on https://www.dawg-ai.com:

**Performance:**
- [ ] Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms
- [ ] Cumulative Layout Shift < 0.1

**Accessibility:**
- [ ] Score > 90
- [ ] No critical a11y issues

**Best Practices:**
- [ ] Score > 90
- [ ] HTTPS enabled
- [ ] No console errors

**SEO:**
- [ ] Score > 90
- [ ] Meta description present
- [ ] Title tag appropriate length

### Load Time
- [ ] Hard refresh (Cmd+Shift+R) completes in < 3 seconds
- [ ] Subsequent page loads < 1 second (caching works)

---

## Stress Testing

### Rapid Clicking
- [ ] Click "New Project" button 10 times rapidly
- [ ] No duplicate modals
- [ ] No console errors
- [ ] App remains responsive

### Rapid Navigation
- [ ] Navigate between pages quickly
- [ ] No race conditions
- [ ] No stuck loading states

### Search Spam
- [ ] Type rapidly in search box
- [ ] Delete and retype
- [ ] Search filters correctly without lag
- [ ] No console errors

---

## Edge Cases

### Empty States
- [ ] Clear search so no results - shows empty state message
- [ ] Empty state has helpful text
- [ ] "Create your first project" link works

### Long Text
- [ ] Try project name with 100+ characters (if creating projects works)
- [ ] Try description with 1000+ characters
- [ ] Text truncates or wraps appropriately

### Special Characters
- [ ] Search for: `<script>alert('test')</script>`
- [ ] Should be safe (no XSS)
- [ ] No console errors

---

## Security Checks

### HTTPS
- [ ] URL shows https://
- [ ] Padlock is green/secure
- [ ] Certificate is valid (click padlock to view)
- [ ] No mixed content warnings

### Content Security Policy
- [ ] No CSP violations in console
- [ ] No inline script errors

### Input Sanitization
- [ ] Forms don't execute script tags
- [ ] SQL injection attempts don't work (type ' OR 1=1-- in forms)

---

## Final Verification

### Critical Success Criteria
- [✓] ZERO console errors (only warnings OK)
- [✓] ZERO JSON parsing errors
- [✓] ZERO failed asset loads
- [✓] All buttons clickable without errors
- [✓] Demo projects display correctly
- [✓] Search works
- [✓] Mobile responsive
- [✓] HTTPS enabled
- [✓] Fast page load (<3s)

### Sign-Off
- [ ] All critical tests passed
- [ ] All major features work
- [ ] No blockers found
- [ ] Ready for production

**Tester Name:** _________________
**Date:** _________________
**Sign-off:** _________________

---

## Issues Found

| Priority | Issue | Steps to Reproduce | Expected | Actual |
|----------|-------|-------------------|----------|--------|
| Critical |       |                   |          |        |
| High     |       |                   |          |        |
| Medium   |       |                   |          |        |
| Low      |       |                   |          |        |

---

## Notes

- Demo mode uses `VITE_DEMO_MODE=true` environment variable
- Mock data includes 2 demo projects and PRO plan entitlements
- Backend API calls are bypassed in demo mode
- Expected console warnings: "Backend not available" (not errors)
- Target browsers: Chrome 90+, Firefox 88+, Safari 14+
- Mobile: iOS 14+, Android 10+
