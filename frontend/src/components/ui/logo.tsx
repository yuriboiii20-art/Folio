import React from 'react';

/**
 * FOLIO brand mark.
 *
 * A two-tone "F" monogram on a slate tile: the spine and top arm in near-white,
 * the middle arm in the amber used by the subject folder cards. Built from
 * three rounded bars, so it stays unmistakably an "F" all the way down to a
 * 16px favicon — no silhouette that can be read as anything else.
 */

export interface FolioLogoProps {
  className?: string;
  /** Pixel size of the square mark. */
  size?: number;
  title?: string;
}

export const FolioMark: React.FC<FolioLogoProps> = ({
  className = '',
  size = 36,
  title = 'FOLIO'
}) => {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="0" y="0" width="32" height="32" rx="8" fill={`url(#${gradientId})`} />

      {/* "F" monogram: spine, top arm, and an amber middle arm */}
      <rect x="9.5" y="6.8" width="4" height="18.4" rx="1.3" fill="#f8fafc" />
      <rect x="9.5" y="6.8" width="13" height="4" rx="1.3" fill="#f8fafc" />
      <rect x="9.5" y="14.2" width="9.4" height="4" rx="1.3" fill="#fbbf24" />
    </svg>
  );
};

export interface FolioLogoLockupProps extends FolioLogoProps {
  /** Hide the text lockup (collapsed sidebar). */
  compact?: boolean;
  tagline?: string;
  /** Text colours for dark vs. light surfaces. */
  tone?: 'dark' | 'light';
}

export const FolioLogo: React.FC<FolioLogoLockupProps> = ({
  className = '',
  size = 36,
  compact = false,
  tagline = 'Academic File Manager',
  tone = 'dark'
}) => {
  const primary = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const secondary = tone === 'dark' ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <FolioMark size={size} className="shrink-0 rounded-lg shadow-sm" />
      {!compact && (
        <div className="flex flex-col overflow-hidden leading-none">
          <span className={`font-black text-lg tracking-wider truncate ${primary}`}>
            FOLIO <span className={secondary}>STUDIO</span>
          </span>
          {tagline && (
            <span className={`text-[10px] font-bold tracking-widest uppercase truncate mt-1 ${secondary}`}>
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FolioLogo;
