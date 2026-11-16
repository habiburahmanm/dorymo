# Project: Nexserve — Psychology-Driven Hyper-Local & Digital Service Marketplace (Bangladesh)

You are an expert Full-Stack Developer, Product Designer, and Behavioral UX Psychologist. I am building **Nexserve**, a multi-service web platform in Bangladesh (starting hyper-locally in specific areas like Khulna) using **React (Vite), Tailwind CSS, Node.js, Express, and Supabase**.

The entire platform will be managed by **a single solo founder (me)** initially, and all payments will be collected manually via my **personal bKash/Nagad SIM number**.

Build the architecture, UI copy, and user flows using **Consumer Psychology** to maximize trust, conversion, and ease of management.

---

## 1. Core Psychological Triggers to Embed in UI/UX
1. **Zero-Friction Entry (Paradox of Choice & Instant Gratification):**
   - Customers must be **Auto-Approved** upon signup. Never block them with forms before they see value.
   - Show clear, fixed starting prices (e.g., `৳700`) and fast response times (`Within 90 mins`) right on the hero/service cards to reduce decision anxiety.
2. **Trust & Safety Bias (Overcoming Fear of Scam):**
   - Bangladeshi users hesitate to pay upfront on new platforms. Use strong psychological reassurance badges everywhere: *"100% Escrow Protected"*, *"NID Verified Professionals"*, *"Pay Only When Satisfied"*.
   - For **Home Repairs**, allow **"Cash After Work"** by default so customers feel zero financial risk on their first booking.
3. **Reciprocity & Loss Aversion (Preventing Platform Bypass):**
   - Hide Provider and Customer phone numbers until an order is confirmed/paid. Force pre-order communication via a clean **In-App Chat**.
   - Show a psychological nudge on checkout: *"Book through Nexserve to get a 7-Day Free Service Warranty & ৳100 Discount on your next order"* (users won't bypass the platform if they fear losing warranty/discounts).
4. **Commitment & Consistency (Equipment Rental Security):**
   - For **Equipment Rental** (drills, generators, tools), require an **NID Photo Upload** + small **Refundable Security Deposit** via bKash/Nagad. Framing the deposit as *"100% Refundable upon safe return"* reduces friction while preventing theft.

---

## 2. Solo-Founder Friendly Workflows (Easy Management for Me)
Since I am managing everything alone, automate status tracking and keep my Admin Dashboard ultra-clean:
1. **Provider Onboarding (Manual Approval):**
   - Providers sign up by uploading their **NID photo, phone number, area/thana, and service skill**.
   - Account status stays `PENDING` until I click **Approve** in my Admin Panel.
   - Provider dashboard must use ultra-simple **Bilingual (English + Bangla)** labels so local technicians/electricians can easily accept/complete jobs without calling me for help.
2. **Hyper-Local Area Filtering:**
   - **Digital Work** (Web, Design, Writing): Open nationwide.
   - **Home Repairs & Equipment Rental**: Filtered strictly by specific areas/thanas (e.g., Sonadanga, Khalishpur, Shib Bari, Nirala).

---

## 3. Manual SIM Payment System (bKash / Nagad Personal)
Implement a completely free, self-hosted manual payment verification flow (no SSLCommerz or third-party API needed):
1. **Checkout UI (Psychological Trust Design):**
   - Show a clean payment box with my personal **bKash / Nagad Personal Number**, exact payable amount in `৳`, and step-by-step "Send Money" visual instructions.
   - Include a one-click **"Copy Number"** button to reduce user frustration.
   - Require only 3 fields: `Method (bKash/Nagad)`, `Sender Last 4 Digits / Full Number`, and `Transaction ID (TrxID)`.
2. **Admin One-Click Verification:**
   - Once submitted, the order status becomes `PAYMENT_VERIFYING` and appears at the top of my Admin Dashboard with a highlight badge.
   - I check the SMS on my phone and click a single **"Approve Payment"** or **"Reject"** button, which instantly notifies the customer and unlocks the job for the provider.

---

## 4. Technical & Design Standards
- **Aesthetic:** Minimalist dark-mode UI (inspired by shadcn/ui & 21st.dev), neutral dark backgrounds, crisp subtle borders, warm orange/amber primary action buttons, zero visual bloat.
- **Database (Supabase):** Design clean relational tables for `users` (role: customer/provider/admin), `services`, `orders`, `manual_payments`, `messages`, and `reviews`.

---

### Execution Instruction:
Confirm you understand both the **technical architecture** and **user psychology** requirements. Start by generating:
1. The complete **Supabase SQL Schema** (with RLS policies).
2. The **Admin One-Click Payment & Provider Approval Dashboard** design and backend logic so I can manage the entire business effortlessly from one screen. save it as MASTER_PROMPT.md and Read MASTER_PROMPT.md and build Step 1 (Database Schema) and Step 2 (Manual SIM Checkout + Admin Verification Panel) first.
