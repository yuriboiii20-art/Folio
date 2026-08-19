import React from 'react';

/**
 * FOLIO brand mark — transparent background open-book & stars logo.
 * Precision-tuned vector geometry with bold stroke weights for maximum visibility.
 */

export interface FolioLogoProps {
  className?: string;
  /** Pixel size of the logo. */
  size?: number;
  title?: string;
  fillColor?: string;
}

export const FolioMark: React.FC<FolioLogoProps> = ({
  className = '',
  size = 52,
  title = 'FOLIO APP',
  fillColor = 'currentColor'
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      {/* Stars Constellation */}
      {/* Topmost Star */}
      <polygon
        points="250,70 256,92 278,92 260,105 267,126 250,113 233,126 240,105 222,92 244,92"
        fill={fillColor}
      />
      {/* Upper-left Star */}
      <polygon
        points="205,115 209.5,129 224.5,129 212.5,138 217,152 205,143 193,152 197.5,138 185.5,129 200.5,129"
        fill={fillColor}
      />
      {/* Upper-right Star */}
      <polygon
        points="295,115 299.5,129 314.5,129 302.5,138 307,152 295,143 283,152 287.5,138 275.5,129 290.5,129"
        fill={fillColor}
      />
      {/* Center Main Star */}
      <polygon
        points="250,145 258,168 282,168 262.5,182 270,205 250,191 230,205 237.5,182 218,168 242,168"
        fill={fillColor}
      />
      {/* Far-left Star */}
      <polygon
        points="175,155 178,165 188,165 180,171 183,181 175,175 167,181 170,171 162,165 172,165"
        fill={fillColor}
      />
      {/* Far-right Star */}
      <polygon
        points="325,155 328,165 338,165 330,171 333,181 325,175 317,181 320,171 312,165 322,165"
        fill={fillColor}
      />
      {/* Lower-left Star */}
      <polygon
        points="200,195 203,205 213,205 205,211 208,221 200,215 192,221 195,211 187,205 197,205"
        fill={fillColor}
      />
      {/* Lower-right Star */}
      <polygon
        points="300,195 303,205 313,205 305,211 308,221 300,215 292,221 295,211 287,205 297,205"
        fill={fillColor}
      />
      {/* Bottom Central Star */}
      <polygon
        points="250,225 253,233 262,233 255,238 257.5,246 250,241 242.5,246 245,238 238,233 247,233"
        fill={fillColor}
      />

      {/* Open Book Graphics */}
      <g stroke={fillColor} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {/* Outer Left Page */}
        <path d="M 250 310 Q 155 300 80 300 C 135 230 200 205 250 225 Z" fill={fillColor} fillOpacity="0.08" />
        {/* Outer Right Page */}
        <path d="M 250 310 Q 345 300 420 300 C 365 230 300 205 250 225 Z" fill={fillColor} fillOpacity="0.08" />

        {/* Inner Left Page Layer Lines */}
        <path d="M 240 248 Q 180 238 115 275" strokeWidth="11" opacity="0.9" />
        <path d="M 240 275 Q 185 268 135 290" strokeWidth="11" opacity="0.75" />

        {/* Inner Right Page Layer Lines */}
        <path d="M 260 248 Q 320 238 385 275" strokeWidth="11" opacity="0.9" />
        <path d="M 260 275 Q 315 268 365 290" strokeWidth="11" opacity="0.75" />

        {/* Spine Bottom Arc */}
        <path d="M 230 315 Q 250 328 270 315" strokeWidth="18" />
      </g>

      {/* Text FOLIO APP */}
      <text
        x="250"
        y="385"
        textAnchor="middle"
        fill={fillColor}
        fontFamily="'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="44"
        fontWeight="900"
        letterSpacing="10"
      >
        FOLIO APP
      </text>
    </svg>
  );
};

export interface FolioLogoLockupProps extends FolioLogoProps {
  /** Hide the text lockup (collapsed sidebar). */
  compact?: boolean;
  /** Text colours for dark vs. light surfaces. */
  tone?: 'dark' | 'light';
}

export const FolioLogo: React.FC<FolioLogoLockupProps> = ({
  className = '',
  size = 54,
  compact = false,
  tone = 'dark'
}) => {
  const primary = tone === 'dark' ? 'text-white' : 'text-slate-900';
  const markColor = tone === 'dark' ? '#ffffff' : '#0f172a';

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <FolioMark size={size} fillColor={markColor} className="shrink-0 drop-shadow-lg" />
      {!compact && (
        <span className={`font-black text-2xl tracking-wider truncate ${primary}`}>
          FOLIO
        </span>
      )}
    </div>
  );
};

export default FolioLogo;


