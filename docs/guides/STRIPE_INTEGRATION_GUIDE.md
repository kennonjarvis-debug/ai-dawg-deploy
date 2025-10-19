# Stripe Integration - Location Guide

**Project:** DAWG AI
**Last Updated:** 2025-10-19

---

## 📍 Stripe Integration Files Location

### Frontend Components

**1. Pricing Configuration**
```
src/config/pricing.ts
```
**Contains:**
- Pricing plans (Free, Pro Monthly, Pro Yearly, Enterprise)
- Price IDs for Stripe
- Feature lists
- Limits per plan

**Key Prices:**
- Pro Monthly: $19.99/month
- Pro Yearly: $199.99/year (2 months free)
- Free: $0
- Enterprise: Contact for pricing

**Environment Variables Used:**
```typescript
process.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
process.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID
```

---

**2. Stripe Payment Form Component**
```
src/components/billing/StripePaymentForm.tsx
```
**Contains:**
- Stripe Elements integration
- Credit card input form
- Payment method setup
- Error handling

**Dependencies:**
```json
{
  "@stripe/react-stripe-js": "^5.0.0",
  "@stripe/stripe-js": "^8.0.0"
}
```

---

**3. Other Billing Components**
```
src/components/billing/
├── index.ts
├── StripePaymentForm.tsx
└── InvoiceHistory.tsx
```

---

**4. Billing Pages**
```
src/pages/dashboard/billing/index.tsx  # Billing dashboard
src/pages/BillingPage.tsx              # Billing page
src/pages/pricing/PricingPage.tsx      # Pricing page (landing)
src/pages/PricingPage.tsx              # Pricing page (app)
```

---

### Backend Integration

**1. API Client Methods**
```
src/api/client.ts (lines 559-605)
```

**Methods:**
```typescript
// Get user's current plan and limits
async getEntitlements(): Promise<{
  plan: string;
  features: Record<string, boolean>;
  limits: any;
}>

// Create Stripe checkout session
async createCheckout(
  plan?: 'PRO' | 'STUDIO',
  priceId?: string
): Promise<{ url: string }>

// Create customer portal session
async createPortal(): Promise<{ url: string }>
```

**API Endpoints Called:**
- `GET /api/v1/billing/entitlements` - Get user's plan
- `POST /api/v1/billing/checkout` - Create checkout session
- `POST /api/v1/billing/portal` - Create portal session

---

**2. Backend Routes**
```
src/backend/routes/advanced-features-routes.ts
```
Contains billing-related route handlers (likely)

---

### Type Definitions

```
src/types/billing.ts
```
**Contains:**
- `PricingPlan` interface
- `BillingInterval` type
- Plan limits
- Feature flags

---

### Environment Variables

**Required in .env:**
```bash
# Stripe Keys (Backend)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Frontend)
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

**Found in:**
- `.env.example` (line 143-147) - Template
- `.env` - Actual keys (git-ignored)

---

### NPM Scripts

**Setup Script:**
```bash
npm run stripe:setup
```
**Runs:** `tsx scripts/stripe/setup.ts`

**Note:** The script file doesn't exist yet, but the command is defined in `package.json`

---

## 🔧 How Stripe Integration Works

### Flow Diagram

```
User clicks "Upgrade to Pro"
       ↓
Frontend: PricingPage.tsx
       ↓
API Call: apiClient.createCheckout('PRO')
       ↓
Backend: POST /api/v1/billing/checkout
       ↓
Stripe API: Create checkout session
       ↓
Return: { url: "https://checkout.stripe.com/..." }
       ↓
Frontend: Redirect to Stripe Checkout
       ↓
User completes payment on Stripe
       ↓
Stripe Webhook: payment_intent.succeeded
       ↓
Backend: Update user subscription
       ↓
User gets Pro features!
```

---

## 📦 Dependencies Installed

**Frontend:**
```json
{
  "@stripe/react-stripe-js": "^5.0.0",
  "@stripe/stripe-js": "^8.0.0"
}
```

**Backend:**
```json
{
  "stripe": "^14.25.0"
}
```

---

## 🎨 Pricing Plans Configuration

**File:** `src/config/pricing.ts`

### Free Plan
- 3 projects
- 8 tracks per project
- 1GB storage
- 10 minutes export/month
- 100 AI credits
- Basic AI assistance
- Community support

### Pro Monthly ($19.99/month)
- Unlimited projects
- Unlimited tracks
- 50GB storage
- Unlimited exports
- 10,000 AI credits
- Advanced AI features
- Vocal coach
- Melody to lyrics
- Priority support
- Offline mode

### Pro Yearly ($199.99/year)
- Everything in Pro Monthly
- 2 months free (16.7% discount)
- 120,000 AI credits
- Annual billing

### Enterprise (Custom)
- Everything in Pro
- Unlimited storage
- Unlimited AI credits
- Custom AI models
- White-label option
- Dedicated support
- SLA guarantee
- Custom integrations
- Team collaboration

---

## 🔌 Integration Points

### Frontend Usage

**1. Display Pricing:**
```typescript
import { PRICING_PLANS, POPULAR_PLAN } from '@/config/pricing';

// Show all plans
PRICING_PLANS.map(plan => <PricingCard plan={plan} />)
```

**2. Create Checkout:**
```typescript
import { apiClient } from '@/api/client';

// Upgrade to Pro Monthly
const { url } = await apiClient.createCheckout('PRO', priceId);
window.location.href = url;
```

**3. Check Entitlements:**
```typescript
const entitlements = await apiClient.getEntitlements();
console.log(entitlements.plan); // 'FREE' | 'PRO' | 'ENTERPRISE'
console.log(entitlements.features); // { ai_assistance: true, ... }
console.log(entitlements.limits); // { max_projects: 3, ... }
```

**4. Manage Billing:**
```typescript
// Open Stripe Customer Portal
const { url } = await apiClient.createPortal();
window.location.href = url;
```

---

## 🚧 Not Yet Implemented

### Missing Backend Endpoints

The API client calls these endpoints, but they may not be implemented yet:

```
GET  /api/v1/billing/entitlements
POST /api/v1/billing/checkout
POST /api/v1/billing/portal
POST /api/v1/billing/webhook  (for Stripe webhooks)
```

**To implement, you need:**
1. Create billing routes file
2. Set up Stripe SDK in backend
3. Implement checkout session creation
4. Implement webhook handler
5. Database schema for subscriptions

---

### Missing Stripe Setup Script

```bash
npm run stripe:setup
```

**What it should do:**
1. Create Stripe products
2. Create price IDs
3. Output price IDs to add to .env
4. Set up webhook endpoint

**Location it should be:** `scripts/stripe/setup.ts`

---

## 🔐 Security Notes

### API Keys

**⚠️ NEVER commit these to git:**
- `STRIPE_SECRET_KEY` - Backend only
- `STRIPE_WEBHOOK_SECRET` - Backend only

**✅ Safe to expose (public):**
- `STRIPE_PUBLISHABLE_KEY` - Frontend
- Price IDs (`price_xxx`) - Frontend

### Current Status

**In your .env file (git-ignored):**
```bash
# You have Stripe keys configured
# They were NOT found in .env.example (good for security)
```

---

## 🎯 Quick Reference

### Frontend Files (React/TypeScript)
| File | Purpose |
|------|---------|
| `src/config/pricing.ts` | Pricing plans config |
| `src/components/billing/StripePaymentForm.tsx` | Payment form |
| `src/components/billing/InvoiceHistory.tsx` | Invoice list |
| `src/pages/dashboard/billing/index.tsx` | Billing dashboard |
| `src/pages/PricingPage.tsx` | Public pricing page |
| `src/api/client.ts` (lines 559-605) | API methods |
| `src/types/billing.ts` | TypeScript types |

### Backend Files
| File | Purpose | Status |
|------|---------|--------|
| `src/backend/routes/advanced-features-routes.ts` | Billing routes | Maybe exists |
| Backend billing handlers | Stripe integration | **Need to verify** |
| Webhook handler | Stripe webhooks | **Need to verify** |

### Package.json Scripts
```bash
npm run stripe:setup   # Setup Stripe (script missing)
```

---

## 📝 Next Steps to Complete Stripe

If you want to fully activate Stripe payments:

### 1. Verify Backend Implementation
```bash
# Check if billing routes exist
ls -la src/backend/routes/*billing*

# Search for Stripe imports in backend
grep -r "stripe" src/backend/
```

### 2. Create Missing Files
- `scripts/stripe/setup.ts` - Setup script
- Backend billing service
- Webhook handler

### 3. Set Up Stripe
```bash
# Login to Stripe
stripe login

# Create products
stripe products create \
  --name "DAWG AI Pro Monthly" \
  --description "Professional music production with unlimited features"

# Create prices
stripe prices create \
  --product prod_xxx \
  --unit-amount 1999 \
  --currency usd \
  --recurring interval=month

# Create webhook
stripe listen --forward-to localhost:3100/api/v1/billing/webhook
```

### 4. Add Price IDs to .env
```bash
VITE_STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
VITE_STRIPE_PRO_YEARLY_PRICE_ID=price_yyy
```

### 5. Test Checkout Flow
```bash
# Start backend
npm run dev:unified

# Start frontend
npm run dev:ui

# Navigate to pricing page
# Click "Upgrade to Pro"
# Should redirect to Stripe Checkout
```

---

## 🆘 Quick Commands

**Find all Stripe code:**
```bash
grep -r "stripe\|Stripe\|STRIPE" src/ --include="*.ts" --include="*.tsx"
```

**Check Stripe packages:**
```bash
npm list | grep stripe
```

**Check environment:**
```bash
grep STRIPE .env.example
```

---

## 💡 Summary

**Stripe Integration Status:**
- ✅ Frontend components exist
- ✅ Pricing plans configured
- ✅ API client methods ready
- ✅ Types defined
- ✅ Stripe packages installed
- ❓ Backend routes (need to verify)
- ❌ Setup script missing
- ❌ Not fully tested

**To activate:**
1. Verify backend implementation
2. Add Stripe keys to .env
3. Create products and prices in Stripe
4. Test checkout flow

**Files are ready, just need backend setup!**
