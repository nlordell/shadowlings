import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

import { toHex, toJson } from "./util.js";

async function setup(zokrates, name) {
  const source = await fs.readFile(`./circuits/${name}.zok`, "utf-8");
  const artifacts = zokrates.compile(source);

  const { vk, pk } = zokrates.setup(artifacts.program);
  const verifier = zokrates.exportSolidityVerifier(vk);

  await fs.writeFile(
    `./app/src/config/${name}/artifacts.json`,
    toJson({ ...artifacts, program: toHex(artifacts.program) }),
  );
  await fs.writeFile(
    `./app/src/config/${name}/keypair.json`,
    toJson({ vk, pk: toHex(pk) }),
  );
  await fs.writeFile(
    `./contracts/src/verifiers/${name}/Verifier.sol`,
    verifier,
  );
}

async function main() {
  const zokrates = await initialize();

  await setup(zokrates, "main");
  await setup(zokrates, "recovery");
  await setup(zokrates, "register");
}

main().catch((err) => console.error(err));
