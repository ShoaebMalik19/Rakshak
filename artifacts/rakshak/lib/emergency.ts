import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Clipboard from 'expo-clipboard';

export interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export type LocationResult =
  | { ok: true; coords: Coords }
  | { ok: false; reason: string };

/** National emergency numbers (India). Shown as tap-to-call everywhere. */
export const HELPLINES = [
  { label: 'Emergency', number: '112', color: '#C0445A' },
  { label: 'Police', number: '100', color: '#1565C0' },
  { label: 'Women', number: '1091', color: '#8E3B8E' },
  { label: 'Ambulance', number: '108', color: '#3A7D44' },
] as const;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

/**
 * Best-effort current position. Never throws: an SOS must still go out
 * without a location, so callers get a reason string instead.
 */
export async function getCurrentLocation(timeoutMs = 8000): Promise<LocationResult> {
  try {
    // On web the permission prompt can sit open indefinitely; don't let it block an SOS.
    const perm = await withTimeout(Location.requestForegroundPermissionsAsync(), 15000);
    if (perm.status !== 'granted') {
      return { ok: false, reason: 'Location permission was not granted' };
    }
    const last = Platform.OS !== 'web' ? await Location.getLastKnownPositionAsync().catch(() => null) : null;
    try {
      const pos = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        timeoutMs,
      );
      return { ok: true, coords: pos.coords };
    } catch (e) {
      if (last) return { ok: true, coords: last.coords };
      throw e;
    }
  } catch (e: any) {
    const msg = e?.message === 'timeout' ? 'Location timed out' : 'Location unavailable';
    return { ok: false, reason: msg };
  }
}

export function mapsLink(c: Coords) {
  return `https://maps.google.com/?q=${c.latitude.toFixed(5)},${c.longitude.toFixed(5)}`;
}

export function buildSOSMessage(userName: string, loc: LocationResult) {
  const name = userName?.trim() || 'Your contact';
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const where = loc.ok
    ? `My location: ${mapsLink(loc.coords)}`
    : `My location could not be determined (${loc.reason.toLowerCase()}).`;
  return `RAKSHAK SOS: ${name} needs help (${time}). ${where} Please call me or 112 immediately.`;
}

export type SendResult =
  /** The OS confirmed the SMS was sent (iOS only). */
  | 'sent'
  /** The SMS composer was opened; we cannot know whether the user pressed Send (Android). */
  | 'composer-opened'
  | 'cancelled'
  /** This platform cannot send SMS (web, or a device without SMS). */
  | 'unavailable'
  | 'failed';

/**
 * Opens the phone's SMS composer pre-filled for every contact.
 * Rakshak never sends silently: the user (or the OS) does the sending,
 * and the result reflects only what we actually know.
 */
export async function sendSOSviaSMS(phones: string[], message: string): Promise<SendResult> {
  if (Platform.OS === 'web' || phones.length === 0) return 'unavailable';
  try {
    if (!(await SMS.isAvailableAsync())) return 'unavailable';
    const { result } = await SMS.sendSMSAsync(phones, message);
    if (result === 'sent') return 'sent';
    if (result === 'cancelled') return 'cancelled';
    return 'composer-opened';
  } catch {
    return 'failed';
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}

export function canWebShare() {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
}

export async function webShare(text: string): Promise<boolean> {
  try {
    await (navigator as any).share({ title: 'Rakshak SOS', text });
    return true;
  } catch {
    return false;
  }
}

export async function callNumber(number: string): Promise<boolean> {
  try {
    await Linking.openURL(`tel:${number}`);
    return true;
  } catch {
    return false;
  }
}

/** Short relative time like "Just now", "5 min ago", "Yesterday". */
export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}
