import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

function toHex(a) {
  return `0x${Buffer.from(a).toString("hex")}`;
}

function toJson(o) {
  return `${JSON.stringify(o, undefined, 2)}\n`;
}

async function main() {
  const zokrates = await initialize();

  const source = await fs.readFile("./circuits/main.zok", "utf-8");
  const { program } = zokrates.compile(source);

  const { vk, pk } = zokrates.setup(program);
  const verifier = zokrates.exportSolidityVerifier(vk);

  await fs.writeFile(
    "./circuits/program.json",
    toJson({ program: toHex(program) }),
  );
  await fs.writeFile("./circuits/keypair.json", toJson({ vk, pk: toHex(pk) }));
  await fs.writeFile("./circuits/Verifier.sol", verifier);
}

main().catch((err) => console.error(err));
