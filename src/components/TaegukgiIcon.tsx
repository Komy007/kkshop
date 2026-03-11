import React from 'react';

interface TaegukgiIconProps {
    className?: string;
    style?: React.CSSProperties;
}

/**
 * SVG Korean Flag (Taegukgi) Icon
 * Replaces the 🇰🇷 emoji across the site.
 * viewBox 900×600 (3:2 official flag ratio)
 */
export default function TaegukgiIcon({ className, style }: TaegukgiIconProps) {
    return (
        <svg
            viewBox="0 0 900 600"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
            role="img"
            aria-label="South Korea"
        >
            {/* White background */}
            <rect width="900" height="600" fill="white" />

            {/* ── Taeguk (Yin-Yang) ──
                Centered at (450,300), outer R=150, inner r=75, rotated 56°
                Layered paint approach: red circle → blue left half → blue/red inner circles */}
            <g transform="translate(450,300) rotate(56)">
                {/* Base: full red disc */}
                <circle r="150" fill="#CD2E3A" />
                {/* Blue left half (overwrites red) */}
                <path d="M0,-150 A150,150 0 0,0 0,150 Z" fill="#003478" />
                {/* Blue lower inner bulge */}
                <circle cy="75" r="75" fill="#003478" />
                {/* Red upper inner bulge */}
                <circle cy="-75" r="75" fill="#CD2E3A" />
            </g>

            {/* ── Trigrams ──
                Bar: height=30, solid width=252, broken half=105 (gap=42)
                Row y-centers: -45, 5, 55  (relative to group center)
                Positions: top-left(153,102) top-right(747,102)
                           bottom-left(153,498) bottom-right(747,498) */}

            {/* 건 (Heaven) — top-left — 3 solid bars — rotate(-56) */}
            <g transform="translate(153,102) rotate(-56)">
                <rect x="-126" y="-60" width="252" height="30" fill="#000" />
                <rect x="-126" y="-10" width="252" height="30" fill="#000" />
                <rect x="-126" y="40"  width="252" height="30" fill="#000" />
            </g>

            {/* 곤 (Earth) — bottom-right — 3 broken bars — rotate(-56) */}
            <g transform="translate(747,498) rotate(-56)">
                <rect x="-126" y="-60" width="105" height="30" fill="#000" />
                <rect x="21"   y="-60" width="105" height="30" fill="#000" />
                <rect x="-126" y="-10" width="105" height="30" fill="#000" />
                <rect x="21"   y="-10" width="105" height="30" fill="#000" />
                <rect x="-126" y="40"  width="105" height="30" fill="#000" />
                <rect x="21"   y="40"  width="105" height="30" fill="#000" />
            </g>

            {/* 감 (Water) — top-right — broken · solid · broken — rotate(56) */}
            <g transform="translate(747,102) rotate(56)">
                <rect x="-126" y="-60" width="105" height="30" fill="#000" />
                <rect x="21"   y="-60" width="105" height="30" fill="#000" />
                <rect x="-126" y="-10" width="252" height="30" fill="#000" />
                <rect x="-126" y="40"  width="105" height="30" fill="#000" />
                <rect x="21"   y="40"  width="105" height="30" fill="#000" />
            </g>

            {/* 이 (Fire) — bottom-left — solid · broken · solid — rotate(56) */}
            <g transform="translate(153,498) rotate(56)">
                <rect x="-126" y="-60" width="252" height="30" fill="#000" />
                <rect x="-126" y="-10" width="105" height="30" fill="#000" />
                <rect x="21"   y="-10" width="105" height="30" fill="#000" />
                <rect x="-126" y="40"  width="252" height="30" fill="#000" />
            </g>
        </svg>
    );
}
