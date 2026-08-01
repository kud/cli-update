import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts", "src/check-child.ts"],
  format: ["esm"],
  dts: {
    // rollup-plugin-dts always forces a baseUrl onto the synthesized compiler
    // options it builds for declaration bundling; TypeScript 6+ treats any
    // baseUrl as deprecated ahead of its removal in 7.0. This project never
    // uses baseUrl-relative imports, so silencing the warning is safe.
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
  clean: true,
  sourcemap: true,
  splitting: false,
})
