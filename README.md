# Dorymo // NexServe

> A psychology-driven, Bengali-first hyper-local & digital service marketplace for Bangladesh (starting hyper-locally in Khulna).  
> **One unified React codebase → Web (PWA) + Android + iOS App.**

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.6.2-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)

---

## 1. Project Overview

**Dorymo** (repo: `NexServe`) solves the trust and friction barriers in Bangladesh's service economy by blending **Consumer Behavioral Psychology** with **Zero-Friction Technology**. The entire platform can be bootstrapped and operated by a **single solo founder** with zero third-party payment gateway merchant fees.

### Three Multi-Service Verticals, One Single Account:
1. **Digital Freelance & Knowledge Work (Nationwide):**
   - Web development, graphic design, copywriting, and digital marketing.
   - Milestone tracking, intellectual property protection, and fixed deliverables.
2. **Hyper-Local Doorstep Home Repairs (Khulna & Thana-level):**
   - Electricians, plumbers, AC technicians, and appliance specialists.
   - Hyper-local dispatch by Thana (Sonadanga, Khalishpur, Boyra, Daulatpur, Nirala, Shib Bari, etc.).
   - **Cash After Work** default for initial bookings to eliminate financial risk.
3. **Equipment & Tool Rental:**
   - Power drills, generators, diagnostic tools, and construction gear.
   - Protected by **NID photo upload** and a **100% refundable security deposit** via bKash/Nagad.

---

## 2. Core Behavioral Psychology & UX Triggers

| Psychological Principle | Implementation in Dorymo |
|---|---|
| **Zero-Friction Entry** | Customers are **auto-approved** upon signup. Upfront fixed pricing (e.g., `৳700`) and clear response times (`Within 90 mins`) remove cognitive fatigue. |
| **Trust & Safety Bias** | Prominent reassurance badges: *“100% Escrow Protected”*, *“NID Verified Professionals”*, *“Pay Only When Satisfied”*. |
| **Loss Aversion (Anti-Bypass)** | Phone numbers and contact info are masked until order confirmation. Checkout offers a *“7-Day Free Service Warranty & ৳100 Discount on your next order”* that is forfeited if bypassed. |
| **Frictionless MFS Payment** | Manual SIM payment to founder's personal bKash/Nagad: 1-click **Copy Number** button, visual step-by-step instructions, and only 3 simple inputs (Method, Sender Number, TrxID). |
| **Bilingual Local Interface** | English + বাংলা support across customer and provider views so local technicians can easily navigate without support calls. |

---

## 3. Solo-Founder Friendly Workflow

- **Zero Gateway Fees:** No SSLCommerz or merchant account required. Customers Send Money directly to the founder's personal bKash/Nagad SIM.
- **One-Click Founder Console (`#/admin-verify`):**
  - **Payment Verification:** Pending payments appear highlighted at the top. The founder checks their phone SMS and clicks **Approve** or **Reject**. Approving instantly unlocks the job, confirms the order, and grants the 7-day warranty.
  - **Provider Onboarding:** Providers register with their skill, Thana, and NID photo. Accounts stay `PENDING` until the founder clicks **Approve**.
  - **Payout & Commission Ledger:** Automatic 10% commission on service price (0% fee on security deposits). When a job completes, a payout row is generated to record the provider payout TrxID and rental deposit refund.

---

## 4. Application Routes (Hash-Based)

Hash-based routing ensures seamless navigation in standard web browsers, progressive web apps (PWA), and native Capacitor mobile WebViews.

| Route Hash | Screen Component | Purpose & Description |
|---|---|---|
| `#/` | `IntentRouter.tsx` | Landing page, multi-service hero showcase, trust badges, and category selector |
| `#/explore-v2` | `ExploreV2.tsx` | Faceted search with Thana location filters, category tabs, and budget sliders |
| `#/pay` | `ManualCheckout.tsx` | Personal SIM checkout with live price breakdown, cash-after-work toggle, and warranty badges |
| `#/provider-jobs` | `ProviderJobs.tsx` | Bilingual provider job board, bid submissions, active jobs, and earnings tracker |
| `#/chat-v2` | `ChatPanel.tsx` | Realtime in-app messaging (phone numbers masked until order confirmation) |
| `#/reviews-v2` | `ReviewsPanel.tsx` | Verified customer reviews and photo proofs from completed orders |
| `#/my-account` | `CustomerDashboard.tsx` | Customer radar: active bookings, service history, and receipt downloads |
| `#/how-it-works` | `HowItWorks.tsx` | Interactive step-by-step buyer and provider journey guide |
| `#/admin-verify` | `AdminVerificationPanel.tsx` | Founder Console: verify payments, approve provider KYC, and record payouts |

---

## 5. Technology Stack & Architecture

```
├── android/                         # Capacitor Android native project (Android Studio / Gradle)
├── ios/                             # Capacitor iOS native project (Xcode / Swift)
├── public/                          # Static assets, Web App Manifest, PWA Service Worker, icons
│   ├── manifest.webmanifest         # PWA configuration
│   ├── sw.js                        # Cache-first service worker (never caches auth/Supabase)
│   └── icons/                       # App icons & apple-touch-icon
├── src/
│   ├── components/                  # UI screens and modular presentation components
│   │   ├── AdminVerificationPanel.tsx # One-click founder triage console
│   │   ├── CustomerDashboard.tsx    # Customer order radar and booking history
│   │   ├── ManualCheckout.tsx       # Psychology-driven bKash/Nagad SIM checkout
│   │   ├── ProviderJobs.tsx         # Bilingual technician job board & earnings
│   │   ├── ExploreV2.tsx            # Hyper-local Thana & category search
│   │   ├── ChatPanel.tsx            # In-app chat with contact masking
│   │   ├── ReviewsPanel.tsx         # Verified reviews panel
│   │   ├── IntentRouter.tsx         # Landing hero and service intent vectors
│   │   └── ui.tsx                   # Design system primitives (buttons, modals, badges)
│   ├── context/
│   │   └── MasterContext.tsx        # Global state, hash navigation, realtime alerts & toasts
│   ├── lib/
│   │   ├── masterDb.ts              # Strongly typed database client calling atomic Postgres RPCs
│   │   ├── pushNotifications.ts     # Capacitor Push & Local Notifications handler
│   │   ├── nativeCamera.ts          # Native camera / photo picker for NID & work proof
│   │   └── supabase.ts              # Supabase client initialization
│   ├── App.tsx                      # Root shell with error boundaries and route switcher
│   ├── main.tsx                     # Entry point mounting MasterProvider and PWA worker
│   └── index.css                    # Tailwind CSS definitions and custom typography
├── supabase/
│   ├── nexserve_master_schema.sql   # Idempotent master database schema, RLS, functions & triggers
│   ├── reset_to_fresh.sql           # Database reset script for fresh deployments
│   ├── cleanup_legacy_v1.sql        # Migration cleanup helper for v1 schema
│   └── functions/push-notify/       # Edge function for cross-device mobile push notifications
├── capacitor.config.ts              # Capacitor configuration for Android & iOS native wrappers
├── vite.config.ts                   # Vite bundler configuration with dynamic base path support
└── package.json                     # Project scripts and dependencies
```

---

## 6. Quick Start & Local Setup

### Prerequisites
- **Node.js**: v20 or later
- **npm**: v10 or later
- A free **Supabase** project ([supabase.com](https://supabase.com))

### 1. Clone & Install
```bash
git clone git@github.com:habiburahmanm/NexServe.git
cd NexServe
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Deploy subpath (default: /dorymo/ or /NexServe/)
VITE_BASE_PATH=/NexServe/

# Personal MFS numbers shown on Checkout
VITE_OWNER_BKASH_NUMBER=017XXXXXXXX
VITE_OWNER_NAGAD_NUMBER=019XXXXXXXX
```

### 3. Initialize the Database
1. Open your Supabase Dashboard → **SQL Editor**.
2. Paste the contents of `supabase/nexserve_master_schema.sql` and click **Run**.
3. The script is completely idempotent: it configures tables, RLS policies, triggers, and storage buckets.

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 7. Admin Promotion & Permissions

To prevent unauthorized privilege escalation, the database trigger automatically assigns the `customer` role to all new signups. To make yourself an administrator:

1. Sign up on the platform with your email.
2. In Supabase **SQL Editor**, execute:
   ```sql
   UPDATE public.users 
   SET role = 'admin', account_status = 'APPROVED'
   WHERE email = 'your-email@example.com';
   ```
3. Refresh the app. The **Founder Console** will now be accessible via the top navigation or at `#/admin-verify`.

---

## 8. Mobile & Production Builds

### Production Web Build
```bash
npm run build
```
Generates production-optimized assets in `dist/`.

### Native Android (Capacitor)
```bash
npm run cap:sync       # Compiles web app and copies assets into android/
npm run cap:android    # Opens the project in Android Studio to build signed APK/AAB
```

### Native iOS (Capacitor)
```bash
npm run cap:sync       # Compiles web app and copies assets into ios/
npm run cap:ios        # Opens Xcode on macOS to build and archive IPA
```

### PWA (Progressive Web App)
The web build includes a service worker (`public/sw.js`) and web app manifest (`public/manifest.webmanifest`). When deployed to HTTPS, mobile visitors receive an install prompt banner with an app icon. The service worker operates cache-first on static assets and strictly passes through all Supabase and authentication calls.

---

## 9. Security & Data Protection Architecture

- **Postgres `SECURITY DEFINER` RPCs:** Critical financial and state changes (such as `create_manual_payment_order` and `verify_manual_payment`) execute inside atomic database functions with strict permission checks.
- **Privacy Masking (`user_private`):** Phone numbers and NID numbers are quarantined in a dedicated `user_private` table. Supabase Row Level Security (RLS) reveals phone numbers only to parties involved in a confirmed/paid order via `has_confirmed_order_with()`.
- **Private Document Storage:** NID document photos are uploaded to a private Supabase Storage bucket (`nid-documents`), protected so that only the document owner and platform administrators can read them.
- **Strict RLS Policies:** There are zero open `UPDATE` policies on the `orders` table and zero client `INSERT` policies on `manual_payments`. All changes flow through validated database procedures.

---

## 10. References & Documentation

- [MASTER_PROMPT.md](file:///home/fardin/Downloads/NexServe-main/MASTER_PROMPT.md): Product specification, behavioral economics foundation, and original requirements.
- [MASTER_IMPLEMENTATION.md](file:///home/fardin/Downloads/NexServe-main/MASTER_IMPLEMENTATION.md): Detailed development log, schema migration notes, and component specifications.
- [PUSH_SETUP.md](file:///home/fardin/Downloads/NexServe-main/PUSH_SETUP.md): Configuration steps for Firebase Cloud Messaging (FCM) and native push notifications.
- [supabase/nexserve_master_schema.sql](file:///home/fardin/Downloads/NexServe-main/supabase/nexserve_master_schema.sql): Complete database schema with RLS and functions.

---

## License

This project is licensed under the [MIT License](LICENSE).
