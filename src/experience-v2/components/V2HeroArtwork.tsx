/** Decorative vector only. No photographic identity, no remote image request. */
export function V2HeroArtwork() {
  return (
    <svg
      className="v2-hero-art"
      viewBox="0 0 600 265"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="v2-night-sky" x1="0" y1="0" x2="600" y2="265">
          <stop stopColor="var(--color-brand-900)" />
          <stop offset=".6" stopColor="var(--color-brand)" />
          <stop offset="1" stopColor="var(--color-cyan)" stopOpacity=".72" />
        </linearGradient>
        <linearGradient id="v2-planet" x1="80" y1="40" x2="280" y2="230">
          <stop stopColor="var(--color-sky-200)" />
          <stop offset=".38" stopColor="var(--color-sky)" />
          <stop offset="1" stopColor="var(--color-brand-strong)" />
        </linearGradient>
        <radialGradient id="v2-light">
          <stop stopColor="var(--color-ice)" stopOpacity=".8" />
          <stop offset="1" stopColor="var(--color-cyan)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="265" rx="18" fill="url(#v2-night-sky)" opacity=".7" />
      <circle cx="407" cy="88" r="94" fill="url(#v2-light)" opacity=".67" />
      <circle cx="399" cy="89" r="68" fill="url(#v2-planet)" opacity=".88" />
      <ellipse
        cx="396"
        cy="91"
        rx="126"
        ry="38"
        transform="rotate(-24 396 91)"
        stroke="var(--color-sky-200)"
        strokeWidth="3"
        strokeOpacity=".85"
      />
      <ellipse
        cx="396"
        cy="91"
        rx="145"
        ry="51"
        transform="rotate(-24 396 91)"
        stroke="var(--color-aqua)"
        strokeWidth="1"
        strokeOpacity=".42"
      />
      <circle cx="350" cy="60" r="5" fill="var(--color-white)" opacity=".75" />
      <circle cx="465" cy="183" r="3" fill="var(--color-white)" opacity=".85" />
      <circle cx="181" cy="52" r="3.5" fill="var(--color-sky-200)" />
      <circle cx="260" cy="102" r="2" fill="var(--color-white)" />
      <circle cx="507" cy="35" r="3" fill="var(--color-white)" />
      <path d="M181 34V45M175.5 39.5H186.5M508 22V30M504 26H512" stroke="var(--color-ice)" strokeWidth="1.8" />
      <path
        d="M34 236L61 204L96 229L131 181L169 210L216 159L262 215L292 197L347 250"
        stroke="var(--color-cyan)"
        strokeWidth="2"
        strokeOpacity=".48"
      />
      <path
        d="M0 226L28 221L42 198L58 216L79 212L104 230L135 206L159 231L180 218L199 244L221 219L245 230L262 211L289 242L313 228L346 250H600V265H0V226Z"
        fill="var(--color-ink-950)"
        opacity=".73"
      />
      <path
        d="M15 249C101 210 195 206 305 245"
        stroke="var(--color-aqua)"
        strokeOpacity=".53"
        strokeWidth="1.5"
      />
      <path d="M455 258C442 228 453 195 488 185C516 177 540 198 541 221L568 258" fill="var(--color-brand-950)" />
      <path d="M477 183C462 174 465 156 476 146C493 130 518 138 520 155C523 172 507 186 492 186" fill="var(--color-brand-950)" />
      <path d="M470 198Q495 215 529 195L542 255H456Z" fill="var(--color-brand-800)" />
      <path d="M477 209Q498 219 524 207" stroke="var(--color-cyan)" strokeOpacity=".6" strokeWidth="2" />
      <rect x="400" y="226" width="150" height="6" rx="3" fill="var(--color-ink-800)" />
      <rect x="408" y="211" width="48" height="14" rx="3" fill="var(--color-brand-300)" opacity=".8" />
      <g transform="translate(550 111)">
        <ellipse cx="0" cy="28" rx="24" ry="7" fill="var(--color-cyan)" opacity=".18" />
        <rect x="-23" y="-13" width="46" height="37" rx="17" fill="var(--color-sky-100)" />
        <rect x="-19" y="-9" width="38" height="28" rx="13" fill="var(--color-ink-950)" />
        <ellipse cx="-8" cy="4" rx="4" ry="6" fill="var(--color-cyan)" />
        <ellipse cx="8" cy="4" rx="4" ry="6" fill="var(--color-cyan)" />
        <path d="M-5 13Q0 17 5 13" stroke="var(--color-aqua)" strokeWidth="1.5" />
        <circle cx="0" cy="-17" r="4" fill="var(--color-accent-soft)" />
        <path d="M-8 24L-13 34M8 24L13 34" stroke="var(--color-sky-200)" strokeWidth="3" />
      </g>
    </svg>
  );
}
