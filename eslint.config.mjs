import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Heavy animation/3D libraries may only be imported from lazily-loaded motion modules.
const heavyImports = [
  { name: "three", message: "Import three only inside src/components/three/*.ts (lazy chunk)." },
  { name: "gsap", message: "Import gsap via @/lib/gsap inside *.motion.ts modules only." },
  { name: "@gsap/react", message: "Use plain gsap.context() inside *.motion.ts modules." },
  { name: "lenis", message: "Lenis is wired once in src/components/motion/MotionRuntimeImpl.tsx." },
  { name: "lenis/react", message: "Lenis is wired once in src/components/motion/MotionRuntimeImpl.tsx." },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: heavyImports, patterns: [{ group: ["gsap/*", "three/*"], message: "Import from @/lib/gsap or inside src/components/three only." }] },
      ],
    },
  },
  {
    files: [
      "src/lib/gsap.ts",
      "src/lib/plugins.ts",
      "src/lib/motion/**/*.ts",
      "src/components/**/*.motion.ts",
      "src/components/**/*.motion.tsx",
      "src/components/motion/MotionRuntimeImpl.tsx",
      "src/components/three/**/*.ts",
      "src/components/transition/**/*.ts",
      "src/components/transition/**/*.tsx",
      "src/components/cursor/**/*.tsx",
    ],
    rules: { "no-restricted-imports": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "content/raw/**",
    "qa/screenshots/**",
    "qa/lighthouse/**",
    "qa/contact-sheets/**",
  ]),
]);

export default eslintConfig;
