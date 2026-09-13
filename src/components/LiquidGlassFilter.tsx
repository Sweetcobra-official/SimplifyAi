import React from 'react';

/**
 * Liquid Glass SVG Filter Definitions
 * Provides optical refraction and fluid displacement for content beneath glass areas
 * via CSS backdrop-filter: url(#liquid-refract).
 */
export const LiquidGlassFilter: React.FC = () => {
  return (
    <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none opacity-0 z-[-1]" aria-hidden="true">
      <defs>
        {/* Optical refraction filter for content underneath glass surfaces */}
        <filter
          id="liquid-refract"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          {/* Smooth fluid wave noise */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.02"
            numOctaves="2"
            seed="5"
            result="liquidNoise"
          />
          <feGaussianBlur in="liquidNoise" stdDeviation="2" result="smoothNoise" />
          {/* Displace the underlying backdrop content */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Gentle refraction for delicate glass pills */}
        <filter
          id="liquid-refract-subtle"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.025 0.025"
            numOctaves="2"
            seed="12"
            result="subtleNoise"
          />
          <feGaussianBlur in="subtleNoise" stdDeviation="1.5" result="smoothSubtle" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothSubtle"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};
