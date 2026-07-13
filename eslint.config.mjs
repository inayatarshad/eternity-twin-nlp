import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts", "public/axe.min.js"] },
  ...coreWebVitals,
  ...nextTypescript,
  {
    // React Three Fiber scene code mutates three.js objects imperatively in
    // useFrame by design; the compiler immutability rule targets plain React
    // data flow and misfires here (decision I12, docs/ui/11).
    files: ["components/scene/**"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
