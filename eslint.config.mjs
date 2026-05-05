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
  // SEC-L6 (Sam, 2026-05-05): every dangerouslySetInnerHTML usage must be
  // an audited safe pattern. Today every occurrence is one of:
  //   - JSON.stringify(schema)        — JSON-LD structured data, safe
  //   - hard-coded template literal   — CarGurus init script, safe
  //   - hard-coded title= prop        — Section component, safe
  // Any new usage requires a `// safe: <reason>` comment immediately
  // above the JSX attribute, OR the reviewer explicitly disables the
  // rule with a justification. Set to "warn" so it surfaces in CI but
  // doesn't block legacy code paths until they're cleaned up.
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "react/no-danger": "warn",
    },
  },
]);

export default eslintConfig;
