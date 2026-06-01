import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      /**
       * React 19 / Next 16 ship this rule at error level. It catches a real
       * pitfall (cascading renders) but also fires on legitimate
       * mount-detection idioms used by next-themes-style hydration guards
       * and hash-anchor sync. We downgrade to warn so the build stays
       * green; reviewers should still scrutinize new violations.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
