/**
 * Filtros SVG compartidos (calor sobre el fuego, agua ondulada, grabado).
 * Un solo `<svg>` oculto en el documento: los `filter=url(#…)` los referencian
 * por id. En tier `low`/reduced-motion el CSS ya no los aplica.
 */
export function SvgDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id="tart-turbulence"
          x="-12%"
          y="-12%"
          width="124%"
          height="124%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.032"
            numOctaves="2"
            seed="7"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="18s"
              values="0.012 0.032;0.018 0.046;0.012 0.032"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter
          id="tart-water"
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.06"
            numOctaves="1"
            seed="3"
            result="ripple"
          >
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.02 0.06;0.026 0.05;0.02 0.06"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="ripple"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
        <filter
          id="tart-engrave"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="12"
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <linearGradient id="tart-sunset-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-top)" />
          <stop offset="0.45" stopColor="var(--sky-mid)" />
          <stop offset="0.75" stopColor="var(--sky-low)" />
          <stop offset="1" stopColor="var(--sky-horizon)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
