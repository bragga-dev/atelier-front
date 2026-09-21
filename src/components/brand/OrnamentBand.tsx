import { useId } from "react";
import { cn } from "@/lib/cn";

const TILE_WIDTH = 32;
const TILE_HEIGHT = 14;

/** Faixa ornamental discreta (fio + estrelas de oito pontas). Puramente decorativa. */
export function OrnamentBand({ className }: { className?: string }) {
  const patternId = `ornament-${useId().replace(/:/g, "")}`;
  const cx = TILE_WIDTH / 2;
  const cy = TILE_HEIGHT / 2;

  return (
    <svg
      className={cn("block h-3.5 w-full", className)}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={patternId} width={TILE_WIDTH} height={TILE_HEIGHT} patternUnits="userSpaceOnUse">
          <line x1={0} y1={cy} x2={TILE_WIDTH} y2={cy} stroke="#c19a6b" strokeWidth={1} />
          <g fill="#fbf6ec" stroke="#b8893b" strokeWidth={1}>
            <rect x={cx - 3.4} y={cy - 3.4} width={6.8} height={6.8} />
            <rect x={cx - 3.4} y={cy - 3.4} width={6.8} height={6.8} transform={`rotate(45 ${cx} ${cy})`} />
          </g>
          <circle cx={cx} cy={cy} r={1.1} fill="#8e2b24" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
