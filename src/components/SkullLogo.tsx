import React from 'react';

interface SkullLogoProps {
  size?: number | string;
  glow?: boolean;
  className?: string;
  animatedEye?: boolean;
}

export const SkullLogo: React.FC<SkullLogoProps> = ({
  size = 40,
  glow = true,
  className = '',
  animatedEye = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className={`transition-all duration-300 ${glow ? 'drop-shadow-[0_0_12px_rgba(224,38,43,0.5)]' : ''}`}
      >
        <defs>
          <radialGradient id="compBgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#2c2220" />
            <stop offset="60%" stopColor="#181211" />
            <stop offset="100%" stopColor="#0a0707" />
          </radialGradient>

          <filter id="compRedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="18" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="compFlame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#E0262B" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#9A9DA1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#EDEFF1" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="compBone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#EDEFF1" />
            <stop offset="100%" stopColor="#9A9DA1" />
          </linearGradient>
        </defs>

        {/* Outer Frame with Cut Corners */}
        <rect
          width="496"
          height="496"
          x="8"
          y="8"
          rx="80"
          fill="url(#compBgGrad)"
          stroke="#382d2a"
          strokeWidth="6"
        />

        {/* Angular Corner Accents */}
        <path d="M40 70 L40 40 L70 40" fill="none" stroke="#E0262B" strokeWidth="6" strokeLinecap="square" />
        <path d="M472 70 L472 40 L442 40" fill="none" stroke="#E0262B" strokeWidth="6" strokeLinecap="square" />
        <path d="M40 442 L40 472 L70 472" fill="none" stroke="#E0262B" strokeWidth="6" strokeLinecap="square" />
        <path d="M472 442 L472 472 L442 472" fill="none" stroke="#E0262B" strokeWidth="6" strokeLinecap="square" />

        {/* Flaming Crest */}
        <g opacity="0.95">
          <path
            d="M256 45 C270 90 295 130 275 170 C290 135 325 120 305 75 C335 115 345 160 330 200 C350 160 380 165 375 210 C365 175 395 190 385 230 C370 200 405 230 390 270 C365 240 360 270 340 280 C360 210 310 180 285 220 C290 160 240 120 256 45 Z"
            fill="url(#compFlame)"
          />
          <path
            d="M256 45 C242 90 217 130 237 170 C222 135 187 120 207 75 C177 115 167 160 182 200 C162 160 132 165 137 210 C147 175 117 190 127 230 C142 200 107 230 122 270 C147 240 152 270 172 280 C152 210 202 180 227 220 C222 160 272 120 256 45 Z"
            fill="url(#compFlame)"
          />
        </g>

        {/* Skull Geometry */}
        <g transform="translate(0, 15)">
          {/* Cranium */}
          <path
            d="M256 120 C175 120 145 175 145 235 C145 275 160 310 185 330 C190 350 195 375 205 385 C215 392 230 395 240 395 L240 430 C240 435 245 440 256 440 C267 440 272 435 272 430 L272 395 C282 395 297 392 307 385 C317 375 322 350 327 330 C352 310 367 275 367 235 C367 175 337 120 256 120 Z"
            fill="url(#compBone)"
            stroke="#9A9DA1"
            strokeWidth="4"
          />

          {/* Brow line */}
          <path d="M170 215 L225 240 L256 230 L287 240 L342 215" fill="none" stroke="#231b19" strokeWidth="6" strokeLinecap="round" />

          {/* Left Eye (Dead steel cavity) */}
          <path d="M180 250 C185 240 220 248 232 260 C238 275 230 305 212 312 C190 315 175 285 180 250 Z" fill="#181211" stroke="#383332" strokeWidth="3" />
          <circle cx="205" cy="280" r="3" fill="#9A9DA1" opacity="0.4" />

          {/* RIGHT EYE: THE GLOWING BLOOD RED EYE */}
          <path d="M332 250 C327 240 292 248 280 260 C274 275 282 305 300 312 C322 315 337 285 332 250 Z" fill="#181211" stroke="#E0262B" strokeWidth="3" />

          <g filter="url(#compRedGlow)" className={animatedEye ? 'animate-pulse' : ''}>
            <circle cx="304" cy="278" r="14" fill="#E0262B" />
            <circle cx="304" cy="278" r="7" fill="#FF5C5C" />
            <circle cx="305" cy="277" r="3" fill="#FFFFFF" />
            {/* Escaping crimson ember */}
            <path d="M312 270 Q340 240 330 205 Q350 230 325 265 Z" fill="#E0262B" opacity="0.9" />
          </g>

          {/* Nasal cavity */}
          <path d="M256 290 L246 325 L252 335 L256 330 L260 335 L266 325 Z" fill="#181211" />

          {/* Teeth */}
          <g fill="#EDEFF1" stroke="#181211" strokeWidth="2">
            <rect x="220" y="370" width="10" height="15" rx="2" />
            <rect x="232" y="368" width="11" height="18" rx="2" />
            <rect x="245" y="367" width="11" height="19" rx="2" />
            <rect x="258" y="367" width="11" height="19" rx="2" />
            <rect x="271" y="368" width="11" height="18" rx="2" />
            <rect x="284" y="370" width="10" height="15" rx="2" />
          </g>
        </g>
      </svg>
    </div>
  );
};
