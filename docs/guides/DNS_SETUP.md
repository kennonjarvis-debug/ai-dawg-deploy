# DNS Configuration for dawg-ai.com → Vercel

## ✅ Domains Added to Vercel
- `dawg-ai.com` ✅
- `www.dawg-ai.com` ✅

## 🔧 DNS Configuration Required

Your domain is currently using **GoDaddy** nameservers. You need to update DNS records.

### Option 1: Update DNS Records on GoDaddy (Recommended - Easiest)

**Go to**: https://dcc.godaddy.com/manage/dawg-ai.com/dns

**Add/Update these records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| A | www | 76.76.21.21 | 600 |

**Steps:**
1. Log into GoDaddy
2. Go to "My Products" → "Domain" → "dawg-ai.com" → "DNS"
3. **Delete or update** existing A records for @ and www
4. **Add** new A records as shown above
5. **Save changes**

**Propagation Time**: 5-60 minutes (usually ~10 mins)

---

### Option 2: Change Nameservers to Vercel (Advanced)

If you prefer Vercel to manage all DNS:

**Change nameservers to:**
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

**Steps:**
1. Go to GoDaddy → Domain Settings → Nameservers
2. Select "Custom Nameservers"
3. Enter the Vercel nameservers above
4. Save

**Propagation Time**: 24-48 hours

---

## ✅ Verification

After updating DNS, verify it's working:

**Check DNS propagation:**
```bash
dig dawg-ai.com +short
# Should show: 76.76.21.21
```

**Test in browser:**
- http://dawg-ai.com (should redirect to https://dawg-ai.com)
- http://www.dawg-ai.com (should work)

**Vercel will automatically provision SSL certificate** once DNS is verified (takes 5-10 mins after DNS propagates).

---

## 🎯 Current Status

**Your Vercel URL (working now)**:
- https://ai-dawg-deploy-37zdid75l-bens-projects-4e60e0da.vercel.app

**Your Custom Domain (will work after DNS update)**:
- https://dawg-ai.com
- https://www.dawg-ai.com

---

## 📧 Email Notification

Vercel will send you an email when:
1. DNS verification completes
2. SSL certificate is issued
3. Domain is ready to use

---

**Recommended**: Use Option 1 (GoDaddy DNS update) - it's faster and simpler!
