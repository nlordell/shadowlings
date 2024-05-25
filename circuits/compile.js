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
  const artifacts = zokrates.compile(source);

  await fs.writeFile(
    "./app/src/config/artifacts.json",
    toJson({ ...artifacts, program: toHex(artifacts.program) }),
  );
}

main().catch((err) => console.error(err));
