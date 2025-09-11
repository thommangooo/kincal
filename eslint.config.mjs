import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-const": "error",
      
      // React rules
      "react-hooks/exhaustive-deps": "error",
      "react/no-unescaped-entities": "error",
      
      // Next.js rules
      "@next/next/no-img-element": "warn",
      
      // General rules
      "no-unused-vars": "off", // Use TypeScript version instead
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
