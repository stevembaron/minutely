import type { Condition } from '../types';

interface IconProps { size?: number; color?: string; }

export function IconRain({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 24H8a3.5 3.5 0 0 1-1-6.9"/>
    <line x1="10" y1="23" x2="9"  y2="26"/>
    <line x1="14" y1="23" x2="13" y2="26"/>
    <line x1="18" y1="23" x2="17" y2="26"/>
  </svg>;
}

export function IconDrizzle({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 24H8a3.5 3.5 0 0 1-1-6.9"/>
    <line x1="11" y1="23" x2="10.5" y2="25"/>
    <line x1="17" y1="23" x2="16.5" y2="25"/>
  </svg>;
}

export function IconClearing({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 17a5 5 0 1 1 9.8-1.8A4 4 0 1 1 19 23H9a3 3 0 0 1 0-6"/>
    <line x1="21" y1="7"  x2="23" y2="5"/>
    <line x1="18" y1="5"  x2="18.5" y2="3"/>
    <line x1="23" y1="12" x2="25" y2="11"/>
  </svg>;
}

export function IconClear({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="14" cy="14" r="5"/>
    <line x1="14" y1="2"  x2="14" y2="5"/>
    <line x1="14" y1="23" x2="14" y2="26"/>
    <line x1="2"  y1="14" x2="5"  y2="14"/>
    <line x1="23" y1="14" x2="26" y2="14"/>
    <line x1="5.6" y1="5.6"  x2="7.8" y2="7.8"/>
    <line x1="20.2" y1="20.2" x2="22.4" y2="22.4"/>
    <line x1="22.4" y1="5.6" x2="20.2" y2="7.8"/>
    <line x1="7.8" y1="20.2" x2="5.6" y2="22.4"/>
  </svg>;
}

export function CondIcon({ condition, size, color }: { condition: Condition; size?: number; color?: string }) {
  if (condition === 'rain')     return <IconRain size={size} color={color} />;
  if (condition === 'drizzle')  return <IconDrizzle size={size} color={color} />;
  if (condition === 'clearing') return <IconClearing size={size} color={color} />;
  return <IconClear size={size} color={color} />;
}
