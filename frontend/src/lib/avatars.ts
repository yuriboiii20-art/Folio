/**
 * FOLIO avatar presets
 * ---------------------------------------------------------------------------
 * Five hand-drawn character avatars the student can pick from, Messenger-style.
 *
 * They are inline SVG rather than hosted images so they need no network, no
 * storage bucket and no CDN — and only the short preset id (e.g. "milo") is
 * persisted on the profile, never the artwork itself.
 */

export interface AvatarPreset {
  id: string;
  name: string;
  /** Ring colour used when this avatar is the selected one. */
  ringClass: string;
  /** Ready-to-use `<img src>` value. */
  src: string;
}

const avatarSvg = (from: string, to: string, body: string): string =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<defs><linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">' +
  `<stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
  '<rect width="64" height="64" rx="32" fill="url(#bg)"/>' +
  body +
  '</svg>';

const toDataUri = (svg: string): string =>
  `data:image/svg+xml,${encodeURIComponent(svg)}`;

// --- Milo the cat ----------------------------------------------------------
const MILO = avatarSvg('#fbbf24', '#f97316', [
  '<path d="M15 23 L19 9 L30 17 Z" fill="#f59e0b"/>',
  '<path d="M49 23 L45 9 L34 17 Z" fill="#f59e0b"/>',
  '<circle cx="16" cy="38" r="4" fill="#fff" opacity=".3"/>',
  '<circle cx="48" cy="38" r="4" fill="#fff" opacity=".3"/>',
  '<circle cx="24" cy="31" r="4.2" fill="#1f2937"/>',
  '<circle cx="40" cy="31" r="4.2" fill="#1f2937"/>',
  '<circle cx="25.6" cy="29.4" r="1.5" fill="#fff"/>',
  '<circle cx="41.6" cy="29.4" r="1.5" fill="#fff"/>',
  '<path d="M30.2 36.4 h3.6 l-1.8 2.2 z" fill="#1f2937"/>',
  '<path d="M28.8 40.4 q3.2 3.4 6.4 0" stroke="#1f2937" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
].join(''));

// --- Bao the panda ---------------------------------------------------------
const BAO = avatarSvg('#94a3b8', '#475569', [
  '<circle cx="17" cy="16" r="7.5" fill="#1e293b"/>',
  '<circle cx="47" cy="16" r="7.5" fill="#1e293b"/>',
  '<ellipse cx="24" cy="31" rx="7" ry="8.5" fill="#1e293b"/>',
  '<ellipse cx="40" cy="31" rx="7" ry="8.5" fill="#1e293b"/>',
  '<circle cx="24" cy="32" r="3.2" fill="#f8fafc"/>',
  '<circle cx="40" cy="32" r="3.2" fill="#f8fafc"/>',
  '<ellipse cx="32" cy="42" rx="3.4" ry="2.4" fill="#1e293b"/>',
  '<path d="M27 46.4 q5 4 10 0" stroke="#1e293b" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
].join(''));

// --- Kiwi the frog ---------------------------------------------------------
const KIWI = avatarSvg('#34d399', '#059669', [
  '<circle cx="16" cy="40" r="3.6" fill="#fff" opacity=".28"/>',
  '<circle cx="48" cy="40" r="3.6" fill="#fff" opacity=".28"/>',
  '<circle cx="21" cy="19" r="9.5" fill="#ecfdf5"/>',
  '<circle cx="43" cy="19" r="9.5" fill="#ecfdf5"/>',
  '<circle cx="21" cy="20" r="4.2" fill="#064e3b"/>',
  '<circle cx="43" cy="20" r="4.2" fill="#064e3b"/>',
  '<circle cx="22.6" cy="18.4" r="1.5" fill="#fff"/>',
  '<circle cx="44.6" cy="18.4" r="1.5" fill="#fff"/>',
  '<path d="M20 36 q12 13 24 0" stroke="#064e3b" stroke-width="3" fill="none" stroke-linecap="round"/>'
].join(''));

// --- Bubs the owl ----------------------------------------------------------
const BUBS = avatarSvg('#38bdf8', '#2563eb', [
  '<path d="M17 13 l7 8" stroke="#0369a1" stroke-width="3.4" stroke-linecap="round"/>',
  '<path d="M47 13 l-7 8" stroke="#0369a1" stroke-width="3.4" stroke-linecap="round"/>',
  '<circle cx="24" cy="29" r="9.5" fill="#f0f9ff"/>',
  '<circle cx="40" cy="29" r="9.5" fill="#f0f9ff"/>',
  '<circle cx="24" cy="29" r="4.6" fill="#0c4a6e"/>',
  '<circle cx="40" cy="29" r="4.6" fill="#0c4a6e"/>',
  '<circle cx="25.6" cy="27.4" r="1.6" fill="#fff"/>',
  '<circle cx="41.6" cy="27.4" r="1.6" fill="#fff"/>',
  '<path d="M32 36 l-4.2 5.4 h8.4 z" fill="#fbbf24"/>',
  '<path d="M22 48 q10 6 20 0" stroke="#f0f9ff" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>'
].join(''));

// --- Nova the star ---------------------------------------------------------
const NOVA = avatarSvg('#818cf8', '#7c3aed', [
  '<path d="M14 16 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 Z" fill="#fff" opacity=".75"/>',
  '<path d="M50 40 l1.1 2.7 2.7 1.1 -2.7 1.1 -1.1 2.7 -1.1 -2.7 -2.7 -1.1 2.7 -1.1 Z" fill="#fff" opacity=".65"/>',
  '<path d="M32 13 l5 10.4 11.4 1.6 -8.2 8 2 11.4 -10.2 -5.4 -10.2 5.4 2 -11.4 -8.2 -8 11.4 -1.6 Z" fill="#fde68a"/>',
  '<circle cx="28" cy="29" r="1.9" fill="#4c1d95"/>',
  '<circle cx="36" cy="29" r="1.9" fill="#4c1d95"/>',
  '<path d="M29.4 33.6 q2.6 2.6 5.2 0" stroke="#4c1d95" stroke-width="1.9" fill="none" stroke-linecap="round"/>'
].join(''));

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'milo', name: 'Milo', ringClass: 'ring-amber-400', src: toDataUri(MILO) },
  { id: 'bao', name: 'Bao', ringClass: 'ring-slate-500', src: toDataUri(BAO) },
  { id: 'kiwi', name: 'Kiwi', ringClass: 'ring-emerald-400', src: toDataUri(KIWI) },
  { id: 'bubs', name: 'Bubs', ringClass: 'ring-sky-400', src: toDataUri(BUBS) },
  { id: 'nova', name: 'Nova', ringClass: 'ring-violet-400', src: toDataUri(NOVA) },
];

export const getAvatarPreset = (id?: string): AvatarPreset | undefined =>
  id ? AVATAR_PRESETS.find(p => p.id === id) : undefined;

/**
 * Resolve which image to render for a profile.
 * A chosen preset wins over an uploaded photo, so clearing the preset brings
 * the original photo back rather than losing it.
 */
export const resolveAvatarSrc = (presetId?: string, uploadedUrl?: string): string =>
  getAvatarPreset(presetId)?.src || uploadedUrl || '';
