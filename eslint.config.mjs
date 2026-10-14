import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".sites-runtime/**",
    ".wrangler/**", // Wrangler's generated/bundled preview modules, never source.
    "dist/**",
    "mobile/dist-mobile/**",
    "mobile/dist-web/**",
    "mobile/android/**",
    "mobile/ios/**",
    "mobile/src/shared/**",
    "next-env.d.ts",
  ]),
  {
    files: ["scripts/**/*.cjs", "mobile/plugins/**/*.cjs"],
    rules: {
      // Node verification programs and Expo config plugins run with CommonJS loaders.
      "@typescript-eslint/no-require-imports": "off",
      "@next/next/no-assign-module-variable": "off",
    },
  },
  {
    files: ["mobile/**/*.{ts,tsx}"],
    rules: {
      // Metro resolves static image/font requires as bundled asset modules.
      // Executable CommonJS imports still use the normal error rule.
      "@typescript-eslint/no-require-imports": ["error", { allow: ["\\.(png|jpg|jpeg|ttf)$"] }],
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
