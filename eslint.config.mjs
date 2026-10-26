import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * ESLint 9 en flat config puro. `eslint-config-next` 16 exporta arrays de
 * configuración flat directamente; NO usar `@eslint/eslintrc`/FlatCompat con
 * esta versión (rompe con "Converting circular structure to JSON").
 */
const config = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      "coverage/**",
      "src/types/global.d.ts",
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    // Reglas del React Compiler: las bajamos a "warn" en los dos casos donde la
    // escritura imperativa es el patrón correcto (capa WebGL y gates de mount).
    // Ver `src/features/three/*` y `components/sections/intro.tsx`.
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      /**
       * En `output: "export"` no existe `/_next/image`: `next/image` con
       * `unoptimized` termina en un `<img>` pelado, sin `srcset`. `ui/media.tsx`
       * arma el `<picture>` contra las variantes de `pnpm images:build`, que es
       * exactamente lo que la regla quiere evitar, así que la regla se apaga con
       * esta nota y no se usa `<img>` en ningún otro lado (hay un test que lo
       * verifica: `tests/base-paths.test.ts`).
       */
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Los scripts de CLI escriben en consola a propósito; y los shaders son
    // strings GLSL donde las reglas de React/TS aplican mal.
    files: ["scripts/**/*.ts", "src/features/three/shaders/*.ts"],
    rules: { "no-console": "off" },
  },
  {
    // La capa WebGL es imperativa por naturaleza (mutamos uniforms y geometría
    // en `useFrame`): el React Compiler no puede modelar refs de Three.
    files: ["src/features/three/**/*.{ts,tsx}"],
    rules: {
      "react/no-unknown-property": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default config;
