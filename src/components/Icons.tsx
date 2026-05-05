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

export function IconSnow({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 23H8a3.5 3.5 0 0 1-1-6.9"/>
    <g strokeWidth="1.4">
      <line x1="10" y1="25" x2="10" y2="27"/><line x1="9" y1="26" x2="11" y2="26"/>
      <line x1="14" y1="25" x2="14" y2="27"/><line x1="13" y1="26" x2="15" y2="26"/>
      <line x1="18" y1="25" x2="18" y2="27"/><line x1="17" y1="26" x2="19" y2="26"/>
    </g>
  </svg>;
}

export function IconFlurries({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 23H8a3.5 3.5 0 0 1-1-6.9"/>
    <g strokeWidth="1.4">
      <line x1="11" y1="25" x2="11" y2="26.5"/><line x1="10.25" y1="25.75" x2="11.75" y2="25.75"/>
      <line x1="17" y1="25" x2="17" y2="26.5"/><line x1="16.25" y1="25.75" x2="17.75" y2="25.75"/>
    </g>
  </svg>;
}

export function IconSleet({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 23H8a3.5 3.5 0 0 1-1-6.9"/>
    <line x1="10" y1="24" x2="9.5" y2="26.5"/>
    <g strokeWidth="1.4">
      <line x1="14" y1="25" x2="14" y2="26.5"/><line x1="13.25" y1="25.75" x2="14.75" y2="25.75"/>
    </g>
    <line x1="18" y1="24" x2="17.5" y2="26.5"/>
  </svg>;
}

export function IconCloudy({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 18a6 6 0 1 1 11.6-2.2A4.5 4.5 0 1 1 19 24H8a3.5 3.5 0 0 1-1-6.9"/>
  </svg>;
}

export function IconPartlyCloudy({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3"/>
    <line x1="9" y1="2"  x2="9"  y2="3.5"/>
    <line x1="2.5" y1="8" x2="4" y2="8"/>
    <line x1="4.5" y1="3.5" x2="5.5" y2="4.5"/>
    <line x1="13.5" y1="3.5" x2="12.5" y2="4.5"/>
    <path d="M9 18a6 6 0 0 1 11.6-2.2A4.5 4.5 0 1 1 21 24H10a3.5 3.5 0 0 1-1-6.9"/>
  </svg>;
}

export function IconFog({ size = 28, color = 'currentColor' }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <line x1="4"  y1="10" x2="24" y2="10"/>
    <line x1="6"  y1="14" x2="22" y2="14"/>
    <line x1="4"  y1="18" x2="24" y2="18"/>
    <line x1="7"  y1="22" x2="21" y2="22"/>
  </svg>;
}

export function CondIcon({ condition, size, color }: { condition: Condition; size?: number; color?: string }) {
  if (condition === 'rain')     return <IconRain size={size} color={color} />;
  if (condition === 'drizzle')  return <IconDrizzle size={size} color={color} />;
  if (condition === 'snow')     return <IconSnow size={size} color={color} />;
  if (condition === 'flurries') return <IconFlurries size={size} color={color} />;
  if (condition === 'sleet')    return <IconSleet size={size} color={color} />;
  if (condition === 'clearing') return <IconClearing size={size} color={color} />;
  return <IconClear size={size} color={color} />;
}
