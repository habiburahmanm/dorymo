/**
 * Phone notifications for the solo founder.
 *
 * Two layers:
 *  1) LOCAL notifications — zero credentials, works right now in the app.
 *     Triggered by the Realtime event already in MasterContext.
 *  2) REMOTE push (FCM/APNs) — for when the app is closed. Requires native
 *     credentials; token is stored in `device_tokens` and the `push-notify`
 *     Edge Function sends the actual push. See PUSH_SETUP.md.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';
import type { NotificationRow } from './masterDb';

let localReady = false;

async function ensureLocal(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (localReady) return true;
  const perm = await LocalNotifications.requestPermissions();
  localReady = perm.display === 'granted';
  return localReady;
}

/** Instant on-device alert when a Realtime notification arrives (app open). */
export async function showLocalAlert(n: NotificationRow): Promise<void> {
  if (!(await ensureLocal())) return;
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2147483647,
          title: n.title,
          body: n.body || 'dorymo আপডেট',
          schedule: { at: new Date(Date.now() + 200) },
          sound: undefined,
          extra: { link: n.link },
        },
      ],
    });
  } catch {
    /* non-critical */
  }
}

/** Ask for push permission and save the FCM/APNs token for server-side sends. */
export async function registerRemotePush(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;

    await PushNotifications.register();

    return await new Promise<string | null>((resolve) => {
      const timer = window.setTimeout(() => resolve(null), 10000);
      PushNotifications.addListener('registration', async (token) => {
        window.clearTimeout(timer);
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase.from('device_tokens').upsert(
            { user_id: user.id, token: token.value, platform: Capacitor.getPlatform() },
            { onConflict: 'token' }
          );
        }
        resolve(token.value);
      });
      PushNotifications.addListener('registrationError', () => {
        window.clearTimeout(timer);
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

/** Handle a push tap -> navigate to the app's hash route. */
export async function initPushNavigation(
  onLink: (link: string) => void
): Promise<(() => void) | undefined> {
  if (!Capacitor.isNativePlatform()) return undefined;
  const push = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const link = action.notification.data?.link as string | undefined;
    if (link) onLink(link);
  });
  const local = await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const link = action.notification.extra?.link as string | undefined;
    if (link) onLink(link);
  });
  return () => { void push.remove(); void local.remove(); };
}
