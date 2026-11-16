# dorymo — Step 1 & Step 2 implemented

Spec source: `MASTER_PROMPT.md` (saved + read). Old prototype files are untouched.

---

## What was built

### Step 1 — Database: `supabase/nexserve_master_schema.sql`
- **Tables:** `users`, `user_private`, `services`, `orders`, `manual_payments`, `messages`, `reviews`
- **Phone + NID are in `user_private`**, never in public `users`. RLS function
  `has_confirmed_order_with()` reveals a phone **only after** a confirmed/paid order.
- **Auto-approval trigger:** customers → `APPROVED` instantly; providers → `PENDING`;
  **nobody can self-assign admin** (forced to `customer` in `handle_new_user()`).
- **Backend logic as Postgres functions** (atomic, secure, no server to host):
  - `create_manual_payment_order()` — creates order + payment claim in one transaction
  - `verify_manual_payment()` — **one-click admin** approve/reject; on approve unlocks
    the job, sets `payment_approved`, adds 7-day warranty + ৳100 next-order discount
  - `approve_provider()` — one-click provider approval
- **RLS** on every table. Only admin can verify payments or approve providers —
  there is deliberately no client update policy on `manual_payments`.

### Step 2 — Manual SIM checkout + Founder Console
- `src/lib/masterDb.ts` — typed data layer calling the RPCs above
- `src/context/MasterContext.tsx` — state, queues, toasts, hash routes `#/pay` / `#/admin-verify`
- `src/components/ManualCheckout.tsx` — psychology copy, fixed price + 90-min badge,
  trust badges, **Cash After Work default for home repairs**, copy-number button,
  only 3 payment fields, loss-aversion nudge (warranty + ৳100), rental deposit framed
  as 100% refundable, bilingual labels
- `src/components/AdminVerificationPanel.tsx` — ONE screen: pending payments at top
  with `NEW` highlight, one-click Approve/Reject; pending providers with NID/skill/area,
  one-click Approve/Reject
- Wired into `main.tsx`, `App.tsx`, `Navbar.tsx`

---

## Why Supabase instead of Express for "backend logic"

For **manual SIM verification** you don't need to trust a client — you verify an SMS
yourself and click a button. Postgres functions + RLS give you:
- atomic approval (order + payment + warranty change in one call),
- security enforced at the database (an attacker cannot call the admin RPC — it checks `is_admin()`),
- zero servers to deploy/patch/pay for — critical for a solo founder.

`puppeteer-core`/Node stay as dev tooling. If you later want **SMS webhooks or bKash
callbacks**, add a small Express service then — the schema already has clean tables.

---

## Setup (3 steps)

1. **Run the schema** in Supabase SQL Editor: paste `supabase/nexserve_master_schema.sql`
   and Run. (Use a fresh project, or uncomment the destructive RESET block first.)
2. **Make yourself admin** (after signing up once):
   ```sql
   update public.users set role = 'admin', account_status = 'APPROVED'
   where email = 'your-email@example.com';
   ```
   Then log out and log back in.
3. **Set your SIM numbers** in `.env`:
   ```
   VITE_OWNER_BKASH_NUMBER=017xxxxxxxx
   VITE_OWNER_NAGAD_NUMBER=019xxxxxxxx
   ```

Then:
- `#/pay` → customer checkout
- `#/admin-verify` → your one-screen console (admin only)

Seed a few services so checkout has something to book:
```sql
insert into public.services (provider_id, category, title, description, price, area, is_nationwide)
select id, 'home_repair', 'Electrician — fault fixing', 'Within 90 mins', 700, 'Sonadanga', false
from public.users where role='provider' and account_status='APPROVED' limit 1;
```
(You must first approve a registered provider, or temporarily insert one for yourself.)

---

## Step 3 — Signup + NID + Bilingual Provider Jobs ✅
- `supabase/nexserve_master_schema.sql` section 8/9:
  - private `nid-documents` storage bucket with owner/admin-only RLS
  - `available_orders_for_provider()` RPC — server-side filter: nationwide digital OR
    the provider's own thana (Sonadanga/Khalishpur/Shib Bari/Nirala)
  - `provider_accept_order()` (atomic — two providers cannot grab the same job) and
    `provider_complete_order()` RPCs
- `src/components/SignUpModal.tsx` — role cards ("Instant approved" for customers,
  "NID check" for providers), skill/category/area, NID photo file input, bilingual copy
- `src/components/ProviderJobs.tsx` — ultra-simple bilingual labels, big one-word
  buttons (নিন/Accept, কাজ শেষ/Done), shows only allowed jobs + my active jobs

## Step 4 — Hyper-local Explore, Chat, Reviews ✅
- `src/components/ExploreV2.tsx` — category tabs (All / Nationwide / Hyper-local /
  Rental), thana chips, price slider, search, **real star ratings** from the reviews
  table, fixed price + 90-min badge + "Pay Only When Satisfied" on every card
- `src/components/ChatPanel.tsx` — in-app chat; **phone reveal is RLS-enforced** only
  after an order reaches `payment_approved`/`in_progress`/`completed`; 5s polling
- `src/components/ReviewsPanel.tsx` — customers review only completed jobs; provider
  sees a real aggregated star average (no hardcoded 5-star fake data)
- `supabase/nexserve_master_schema.sql` section 10: `submit_review()` RPC (1–5,
  customer-of-completed-order only)
- Navbar links for Explore / Jobs / Chat / Reviews; SignUpModal replaces the old
  auth gate for v2 screens

## Routes
| Hash | Screen |
|---|---|
| `#/explore-v2` | Explore (hyper-local / nationwide) |
| `#/pay` | Manual SIM checkout (with preselected service) |
| `#/provider-jobs` | Bilingual provider jobs |
| `#/chat-v2` | In-app chat |
| `#/reviews-v2` | Reviews |
| `#/admin-verify` | Founder Console |

## Step 5 — Supabase Realtime Notifications ✅
- `supabase/nexserve_master_schema.sql` section 12:
  - `notifications` table (type/title/body/link/is_read) with RLS (own + admin)
  - DB triggers auto-notify the right person, instant and server-side:
    - new manual payment → **all admins** ("নতুন পেমেন্ট যাচাই করুন" → Founder Console)
    - payment approved/rejected → customer (approved also mentions warranty + ৳100)
    - new provider signup → admins; approval/rejection → that provider
    - new chat message → the other participant
    - job accepted/completed → customer (review nudge)
  - `notify_user()` / `notify_admins()` helpers; table added to `supabase_realtime`
    publication (idempotent DO block) + `REPLICA IDENTITY FULL`
- `src/lib/masterDb.ts` — `fetchNotifications`, `markNotificationRead`, `markAllNotificationsRead`
- `src/context/MasterContext.tsx` — subscribes to `postgres_changes` INSERT filtered to
  the current user → instant toast + bell badge; admin queue auto-refreshes on new
  payment/provider; exposes `notifications`, `unreadCount`, `markRead`, `markAllRead`,
  `realtimeConnected`
- `src/components/Navbar.tsx` — bell with unread badge + green "live" dot + dropdown
  (desktop + mobile); clicking a notification follows its hash link and marks it read
- `src/components/ChatPanel.tsx` — messages now arrive **instantly** via Realtime
  (15s polling kept only as fallback); conversation list refreshes on new notifications

## Step 6 — Website + App from ONE codebase ✅ (PWA + Capacitor)

### PWA (installable website)
- `public/manifest.webmanifest` — Bengali name, `#f97316` theme, standalone display,
  relative `start_url`/`scope`, 192/512/maskable icons
- `public/icons/*.png` — generated PNG icons (orange `#f97316`, black "ন") using the
  local Noto Sans Bengali font
- `public/sw.js` — offline app shell; **never caches Supabase/auth/storage/realtime**
  traffic; network-first for navigation, cache-first for static assets
- `src/main.tsx` — registers the SW in production only (`import.meta.env.PROD`)
- `src/components/InstallPrompt.tsx` — "Install App" banner via `beforeinstallprompt`,
  hidden inside the native app via `Capacitor.isNativePlatform()`

### Capacitor (real Android / iOS apps)
- Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
- `capacitor.config.ts` — app id `com.nexserve.app`, `webDir: dist`, HTTPS scheme,
  Supabase/bKash/SSLCommerz navigation allowlist
- Native projects generated: `android/` and `ios/`
- **Vite base is mode-aware** (`vite.config.ts`): web → `/NexServe/` (GitHub Pages),
  `--mode capacitor` → `./` (relative paths so assets work in the WebView)
- Scripts: `npm run cap:init`, `cap:sync`, `cap:android`, `cap:ios`

### How to build
```bash
# Website (PWA) -> dist/ with /NexServe/ base
npm run build

# Native app (relative asset paths) -> syncs into android/ + ios/
npm run cap:sync
npm run cap:android   # opens Android Studio -> Build > Generate Signed Bundle
npm run cap:ios       # macOS only -> Xcode -> Archive
```

### Icon note
Replace the generated icons in `public/icons/` with your brand artwork when ready.
Regenerate native icons with `npx cap sync` after changing them.

## Step 7 — Phone Notifications + NID Camera ✅ (optional extras)

### Phone notifications (two layers)
- **Local, zero-config:** `src/lib/pushNotifications.ts` `showLocalAlert()` fires an
  on-device notification from the existing Realtime event while the app is open
- **Remote FCM/APNs:** `@capacitor/push-notifications` requests permission and saves
  the device token in `public.device_tokens` (schema section 13, RLS: owner only;
  no select policy — only the service-role function reads tokens)
- `supabase/functions/push-notify/index.ts` — sends FCM v1 pushes (RS256 JWT via
  Web Crypto) to every device token of the notification's recipient
- `PUSH_SETUP.md` — exact Firebase / Supabase secret / Database Webhook / native
  credential steps (needs one-time credentials for closed-app delivery)
- Tapping a notification follows its hash link (`#/admin-verify`, `#/chat-v2`, …)
- Android manifest updated with CAMERA, READ_MEDIA_IMAGES, POST_NOTIFICATIONS,
  VIBRATE permissions

### NID camera capture
- `@capacitor/camera` installed and synced into both native projects
- `src/lib/nativeCamera.ts` — native: camera/gallery picker → `File`; web: unchanged
  file picker. Both upload through the same private `nid-documents` bucket.
- `SignUpModal` shows "ক্যামেরা বা গ্যালারি থেকে NID তুলুন" on native, file picker on web

## Step 8 — Security hardening + v1 retirement ✅

### Security fixes (supabase/nexserve_master_schema.sql)
- **Removed open UPDATE policies** on `orders` (`orders_customer_update`,
  `orders_provider_update`). Customers/providers could previously change `status`,
  `amount`, `provider_id`. All mutations now go through strict `SECURITY DEFINER` RPCs.
- **Removed direct INSERT policy** on `manual_payments`. Claims can only be created by
  `create_manual_payment_order()`, which computes the amount server-side from the service.
- **Duplicate TrxID protection**: `manual_payments.trx_id` UNIQUE constraint + check in
  the RPC, so one bKash/Nagad TrxID cannot be claimed by two orders.
- New RPCs: `customer_cancel_order()` and `customer_settle_cash_order()` (records the
  customer's payment TrxID after a Cash-After-Work job). Added `orders.settlement_trx_id`
  with an idempotent migration.
- Chat UI exposes Cancel (while verifying) and "Settle after work" (cash orders).

### Retired the duplicate v1 app
- Deleted `EcosystemContext`, `lib/db.ts`, old `types.ts`, old AuthGate/ServiceFinder/
  HybridCheckout/CustomerPortal/ProviderPortal/AdminPortal, old scripts + screenshots.
- `App.tsx` and `Navbar.tsx` now use **only** MasterContext; `IntentRouter`, `HowItWorks`
  and `Footer` were migrated to v2 hooks. `main.tsx` no longer wraps EcosystemProvider.
- Old schema archived as `supabase/schema_legacy_v1.sql`; old payment/escrow Edge Functions
  removed (they referenced the retired schema). `README.md` rewritten; old docs marked archived.
- Added an `ErrorBoundary` so one bad render cannot blank the app.
- Side benefit: production JS bundle dropped from ~779 kB to ~654 kB.

### ⚠️ Re-run the schema in Supabase
These are policy/constraint/RPC changes — paste `supabase/nexserve_master_schema.sql`
into the SQL Editor and Run again. It is idempotent, but the old permissive policies
are dropped by name, so make sure the script runs successfully.

## Step 9 — Profile photos (customers + providers) ✅
- `supabase/nexserve_master_schema.sql` section 14: public `avatars` bucket with
  owner-only insert/update/delete + public read. NID remains in the separate private bucket.
- `src/lib/masterDb.ts` — `saveAvatar()` uploads to `avatars/<user-id>/...`, stores the
  public URL in `users.avatar_url`; `clearAvatar()` removes the reference.
- `src/components/AvatarModal.tsx` — camera on native, file picker on web, live preview,
  save/remove. Opened from the profile menu in `Navbar` (desktop + mobile).
- Avatars are displayed in the navbar, mobile menu and in-app chat (thread header + list).

## Step 10 — Rebrand: NexServe → dorymo ✅
- Brand palette sampled from the provided reference photo: Indigo `#2F3080`,
  Sunset Orange `#FF8527`, Teal `#199698`, Warm Off-white `#F5F2E9`
  (Tailwind `dory.*` + orange override, CSS variables, favicon).
- Final logo traced from `public/dorymo-reference.jfif`: orange D with a 3D open door
  (darker-orange side panel + white handle) and a white check with an orange outline
  whose tail sweeps past the emblem. `dorymo-logo.svg/.png`, `dorymo-icon.svg`, all
  PWA/native icons and the favicon were regenerated from that single mark.
- Logo files: `public/dorymo-logo.svg` + `.png` (2400×640, rasterized with headless Chrome)
  and `public/dorymo-icon.svg`; app icons regenerated in the new colors.
- All UI brand text, document title, PWA manifest, Capacitor app name/id (`com.dorymo.app`),
  storage keys, service-worker cache name and notification copy updated.
- Navbar + Footer now show the logo mark + "dorymo" wordmark.
- `VITE_BASE_PATH` (default `/dorymo/`) controls the deploy subpath; set it to your
  GitHub repo name if different, or rename the repo to `dorymo`.

## Step 11 — Provider services + Commission ledger ✅
- **Provider self-service:** `ProviderJobs` has a new "আমার সেবা · My Services" tab with
  create/edit/pause/delete for service listings (title, category, price, thana,
  response minutes, refundable deposit). `masterDb` exposes `fetchMyServices`,
  `createService`, `updateService`, `deleteService` (RLS restricts to own rows).
- **Commission (10% of service price, 0% of deposit)** is computed server-side in
  `create_manual_payment_order()` and stored on the order (`commission_amount`,
  `provider_payout_amount`). Checkout shows the fee transparently.
- **Payout ledger:** completing a job auto-creates a `payouts` row. Founder Console
  has "Commission earned" + "Payouts due" stats and a "Commission & provider payouts"
  queue with one-click **Mark paid** (records your bKash/Nagad TrxID) and
  **Refund deposit** (records the customer's refund TrxID). RPCs:
  `record_payout()`, `record_deposit_refund()` — admin-only.
- Provider form shows "আপনি পাবেন ৳X" (price minus 10%) before saving.

## Step 12 — Deposit returns + Customer dashboard ✅
- **Deposit return lifecycle:** orders now carry `scheduled_date`, `time_slot`,
  `deposit_return_status` and `return_note` (idempotent migrations included).
  `customer_confirm_tool_return()` lets the customer report a clean return or damage;
  `record_deposit_refund()` lets the founder record the refund TrxID and close the
  deposit. New notification triggers alert the founder on damage / clean return and
  the customer when the refund is recorded.
- **Saved addresses** table with owner-only RLS; checkout can pick a saved address.
- **Customer dashboard** (`#/my-account`): Orders tab (status, schedule, address,
  deposit status; actions: cancel / settle cash / confirm return / review / chat),
  Addresses tab (add / delete / set default) and Profile tab (photo).
- Checkout now collects an optional **date + time slot** for local services.
- Founder's payout queue shows the return status and warns to hold funds on damage.

## Step 13 — Scroll motion ✅
- `Reveal.tsx` — IntersectionObserver-based fade + slide-up, staggered via `delay`;
  respects `prefers-reduced-motion`. Applied to landing sections, how-it-works
  sections, Explore result cards and customer order cards.
- `ScrollProgress.tsx` — thin orange progress bar fixed at the top of the viewport.
- Hero artwork parallax on scroll (`parallax-hero`) in `IntentRouter`.
- CSS for `.reveal` / `.reveal-visible` / `.parallax-hero` in `src/index.css`.
- Visually verified with headless Chrome: reveal count grows as you scroll, progress
  bar tracks position.

## Signup form rules
- Provider signup REQUIRES: service skill, category, thana, NID number and NID photo
  (enforced in `signUpV2`). Phone is required for everyone.
- Signup form has Password + Confirm Password, each with its own show/hide eye button;
  the two values must match before the account is created.

## Optional future work
- SMS gateway alert to the founder's personal phone (cheapest alternative to FCM;
  the DB trigger + notification row are already in place — just point a webhook at it)
- Add an admin "resend verification" action for rejected providers
- Rental deposit refund flow + provider payout ledger (needs a real money workflow)
