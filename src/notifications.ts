import type { Settings, MinuteForecast, CurrentConditions, Condition } from './types';

const isWet = (c: Condition) => c === 'rain' || c === 'drizzle' || c === 'snow' || c === 'flurries' || c === 'sleet';
const isDry = (c: Condition) => c === 'clear' || c === 'clearing';

// Minimum minutes between notifications of the same kind (avoid spam during
// the 10-minute auto-refresh cycle when conditions hover near a threshold).
const COOLDOWN_MIN = 30;

const COOLDOWN_KEY = 'soon-alert-cooldowns';
type Cooldowns = Partial<Record<'rain' | 'clear' | 'worsen', number>>;

function loadCooldowns(): Cooldowns {
  try { const v = localStorage.getItem(COOLDOWN_KEY); return v ? JSON.parse(v) : {}; } catch { return {}; }
}
function saveCooldowns(c: Cooldowns) {
  try { localStorage.setItem(COOLDOWN_KEY, JSON.stringify(c)); } catch { /* quota */ }
}
function withinCooldown(kind: keyof Cooldowns): boolean {
  const c = loadCooldowns();
  const last = c[kind];
  if (!last) return false;
  return Date.now() - last < COOLDOWN_MIN * 60 * 1000;
}
function markFired(kind: keyof Cooldowns) {
  const c = loadCooldowns();
  c[kind] = Date.now();
  saveCooldowns(c);
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function notify(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: '/minutely/soon-icon.svg', badge: '/minutely/soon-icon.svg' });
  } catch { /* some platforms reject without a service worker */ }
}

interface Args {
  settings: Settings;
  prevCurrent: CurrentConditions | null;
  prevForecast: MinuteForecast[];
  newCurrent: CurrentConditions;
  newForecast: MinuteForecast[];
}

export function evaluateAlerts({ settings, prevCurrent, prevForecast, newForecast }: Args) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (newForecast.length === 0) return;

  const now = newForecast[0];
  const wasWet = prevForecast[0] && isWet(prevForecast[0].condition);
  const isCurrentlyWet = isWet(now.condition);

  // ── alertRain: dry now, precip starting within 5–15 min
  if (settings.alertRain && !isCurrentlyWet && !withinCooldown('rain')) {
    for (let i = 1; i < Math.min(15, newForecast.length); i++) {
      if (isWet(newForecast[i].condition)) {
        const c = newForecast[i].condition;
        const noun = c === 'rain' ? 'Rain' : c === 'snow' ? 'Snow' : c === 'flurries' ? 'Flurries' : c === 'sleet' ? 'Sleet' : 'Drizzle';
        notify(`${noun} starting in ${i} min`, `Heads up — precipitation soon at your location.`, 'soon-alert-rain');
        markFired('rain');
        break;
      }
    }
  }

  // ── alertClear: wet now, dry break of 10+ min coming within 20 min
  if (settings.alertClear && isCurrentlyWet && !withinCooldown('clear')) {
    for (let i = 1; i < Math.min(20, newForecast.length); i++) {
      if (isDry(newForecast[i].condition)) {
        let dryEnd = i;
        while (dryEnd < newForecast.length && isDry(newForecast[dryEnd].condition)) dryEnd++;
        if (dryEnd - i >= 10) {
          notify(`Clear break in ${i} min`, `${dryEnd - i} min window of dry weather coming up.`, 'soon-alert-clear');
          markFired('clear');
          break;
        }
      }
    }
  }

  // ── alertWorsen: conditions intensifying or transitioning into precip
  if (settings.alertWorsen && !withinCooldown('worsen')) {
    // Compare current condition to prev fetch
    const wentWet = prevCurrent != null && !wasWet && isCurrentlyWet;
    const drizzleToRain = prevCurrent != null && prevForecast[0]?.condition === 'drizzle' && now.condition === 'rain';
    const flurriesToSnow = prevCurrent != null && prevForecast[0]?.condition === 'flurries' && now.condition === 'snow';
    const intensified = isCurrentlyWet && now.precip > (prevForecast[0]?.precip ?? 0) + 0.3;
    if (wentWet || drizzleToRain || flurriesToSnow || intensified) {
      const noun = now.condition === 'snow' || now.condition === 'flurries' ? 'snow'
                 : now.condition === 'sleet' ? 'sleet' : 'rain';
      notify('Conditions worsening', `Expect heavier ${noun} — plan accordingly.`, 'soon-alert-worsen');
      markFired('worsen');
    }
  }
}
