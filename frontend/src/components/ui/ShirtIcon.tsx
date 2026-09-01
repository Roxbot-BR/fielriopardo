"use client";

/**
 * SVG shirt icon — Corinthians black & white.
 * Use <ShirtIcon /> to render two shirts (white + black) side by side.
 * Use <ShirtSVG fill="white" stroke="black" /> for a single shirt.
 */

interface ShirtSVGProps {
  fill: string;
  stroke: string;
  size?: number;
  className?: string;
}

export function ShirtSVG({ fill, stroke, size = 32, className = "" }: ShirtSVGProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 90"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Main shirt body + sleeves */}
      <path
        d="M34,7 Q40,3 50,3 Q60,3 66,7 L86,14 L96,34 L78,40 L78,85 L22,85 L22,40 L4,34 L14,14 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* V-neck collar */}
      <path
        d="M34,7 Q50,28 66,7"
        fill="none"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Two shirts side by side: white (home) + black (away) */
export function ShirtIcon({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label="Uniformes">
      <ShirtSVG fill="white" stroke="black" size={size} />
      <ShirtSVG fill="#111111" stroke="white" size={size} />
    </span>
  );
}

/** Kit placeholder card matching the kit type colors */
interface KitPlaceholderProps {
  type: string;
  yearStart: number;
  height?: number;
}

const KIT_COLORS: Record<string, { fill: string; stroke: string; bg: string; textColor: string }> = {
  home:       { fill: "white",   stroke: "black",   bg: "#f5f5f5", textColor: "#111" },
  away:       { fill: "#111",    stroke: "white",   bg: "#1a1a1a", textColor: "#eee" },
  third:      { fill: "#4a0072", stroke: "#e0b0ff", bg: "#2d0045", textColor: "#e0b0ff" },
  goalkeeper: { fill: "#ca8a04", stroke: "#111",    bg: "#422006", textColor: "#fde68a" },
  special:    { fill: "#C8A951", stroke: "#111",    bg: "#2a200a", textColor: "#C8A951" },
};

export function KitPlaceholder({ type, yearStart, height = 160 }: KitPlaceholderProps) {
  const cfg = KIT_COLORS[type] ?? KIT_COLORS.home;
  const shirtSize = Math.round(height * 0.55);
  return (
    <div
      style={{ height, background: cfg.bg }}
      className="w-full flex flex-col items-center justify-center gap-2"
    >
      <ShirtSVG fill={cfg.fill} stroke={cfg.stroke} size={shirtSize} />
      <span style={{ color: cfg.textColor, fontSize: 11, opacity: 0.6 }}>{yearStart}</span>
    </div>
  );
}
