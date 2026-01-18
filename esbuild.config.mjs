import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import { baseConfig } from "./build/esbuild.base.mjs";

const prod = process.argv[2] === "production";

const buildOptions = {
  ...baseConfig,
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
  sourcemap: prod ? false : "inline",
};

if (!prod) {
  buildOptions.watch = true;
}

esbuild.build(buildOptions).catch(() => process.exit(1));