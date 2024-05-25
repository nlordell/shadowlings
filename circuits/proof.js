import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

import { buildMimcHasher, fromHex, toFieldElement } from "./util.js";

const owner = "0x1111111111111111111111111111111111111111";
const entropy = "0x5afe";
const salt = "0x01020304";
const pepper = "0x2a";
const executionHash =
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

async function main() {
  const zokrates = await initialize();
  const mimc = await buildMimcHasher();

  const artifacts = JSON.parse(
    await fs.readFile(
      "./app/src/config/artifacts.json",
      "utf-8",
    ),
  );
  const { vk, pk } = JSON.parse(
    await fs.readFile(
      "./app/src/config/keypair.json",
      "utf-8",
    ),
  );

  const ownerHash = mimc(owner, entropy);
  const saltHash = mimc(salt, pepper);
  const commitHash = mimc(ownerHash, saltHash);
  const nullifierHash = mimc(executionHash, saltHash);
  const { witness } = zokrates.computeWitness(
    {
      ...artifacts,
      program: fromHex(artifacts.program),
    },
    [commitHash, nullifierHash, executionHash, ownerHash, salt]
      .map(toFieldElement),
  );

  const proof = zokrates.generateProof(
    fromHex(artifacts.program),
    witness,
    fromHex(pk),
  );

  if (!zokrates.verify(vk, proof)) {
    throw new Error("error locally verifying proof");
  }

  console.log(proof.proof);
  console.log({ inputs: proof.inputs });
}

main().catch((err) => console.error(err));
