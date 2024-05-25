import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

import { toHex, toJson } from "./util.js";

async function main() {
  const zokrates = await initialize();

  const source = await fs.readFile("./circuits/main.zok", "utf-8");
  const artifacts = zokrates.compile(source);

  const { vk, pk } = zokrates.setup(artifacts.program);
  const verifier = zokrates.exportSolidityVerifier(vk);

  await fs.writeFile(
    "./app/src/config/artifacts.json",
    toJson({ ...artifacts, program: toHex(artifacts.program) }),
  );
  await fs.writeFile(
    "./app/src/config/keypair.json",
    toJson({ vk, pk: toHex(pk) }),
  );
  await fs.writeFile("./contracts/src/Verifier.sol", verifier);
}

main().catch((err) => console.error(err));
