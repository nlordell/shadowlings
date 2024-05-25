import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

import { toHex, toJson } from "./util.js";

async function compile(zokrates, name) {
  const source = await fs.readFile(`./circuits/${name}.zok`, "utf-8");
  const artifacts = zokrates.compile(source);

  await fs.writeFile(
    `./app/src/config/${name}/artifacts.json`,
    toJson({ ...artifacts, program: toHex(artifacts.program) }),
  );
}

async function main() {
  const zokrates = await initialize();

  await compile(zokrates, "main");
  await compile(zokrates, "recovery");
}

main().catch((err) => console.error(err));
