# dorymo — Phone Notifications Setup

Two layers are implemented:

| Layer | When it works | Needs credentials? |
|---|---|---|
| **Local notification + in-app toast/bell** | App is open (Realtime event) | ❌ No — works immediately |
| **Remote FCM/APNs push** | App is closed / background | ✅ Yes — one-time setup below |

---

## 1. Already automatic (no setup)
The `notifications` table has DB triggers (schema section 12). The instant a payment
or provider arrives, Supabase Realtime pushes it to the open app. In the native app
`showLocalAlert()` also fires an on-device notification — no Firebase needed.

## 2. Remote push to a closed app (one-time)

### A. Firebase
1. Create a Firebase project → **Project Settings → Service accounts**.
2. Click **Generate new private key** → download the JSON.
3. Note the `project_id` from that file.

### B. Supabase Edge Function secrets
In Supabase Dashboard → **Edge Functions → Secrets**, add:
```
FCM_SERVICE_ACCOUNT_JSON = <paste the ENTIRE JSON as one line>
FCM_PROJECT_ID          = <project_id>
```
Deploy the function:
```bash
supabase functions deploy push-notify
```

### C. Database Webhook (Dashboard)
Dashboard → **Database → Webhooks → Create a new webhook**
- Name: `push-on-notification`
- Table: `public.notifications`
- Events: ✅ **INSERT**
- URL: `https://<your-project>.supabase.co/functions/v1/push-notify`
- HTTP Headers: add
  - `Authorization: Bearer <SERVICE_ROLE_KEY>`
  - `Content-Type: application/json`

### D. Native app credentials
- **Android:** download `google-services.json` from Firebase → place at
  `android/app/google-services.json`. The Capacitor push plugin picks it up;
  rebuild with `npm run cap:sync` then Android Studio.
- **iOS:** download `GoogleService-Info.plist` → place at `ios/App/App/GoogleService-Info.plist`,
  enable Push Notifications capability in Xcode. iOS build requires macOS + Apple Developer account.

### E. Verify
1. Open the app, log in as admin → push permission is requested automatically.
2. Place a test order from another account.
3. You should get a phone push even with the app closed. Tap it → opens the right screen.

---

## 3. NID camera capture
`@capacitor/camera` is wired into the provider signup:
- **Native app:** "ক্যামেরা বা গ্যালারি থেকে NID তুলুন" → camera or gallery picker.
- **Website:** normal file picker (unchanged).
Both paths upload to the private `nid-documents` bucket via the same `uploadNidPhoto()`.

If you get a camera permission error on Android, confirm the plugin is synced:
```bash
npm run cap:sync
```
and that `android/app/src/main/AndroidManifest.xml` contains:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```
(Capacitor adds this automatically on `cap sync`.)

---

## 4. SMS to your personal phone (optional, cheapest)
If you don't want Firebase, the simplest founder alert is an **SMS webhook** on the
same notifications table using any Bangladeshi SMS gateway. The DB trigger already
creates the row — point a webhook at your SMS provider instead of the push function.
The in-app bell + local notification will still work regardless.
