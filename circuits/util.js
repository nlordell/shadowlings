import { buildMimcSponge } from "circomlibjs";

export async function buildMimcHasher() {
  const mimcSponge = await buildMimcSponge();
  return (a, b) =>
    `0x${mimcSponge.F.toString(mimcSponge.multiHash([a, b]), 16)}`;
}

export function toFieldElement(x) {
  return BigInt(x).toString();
}

export function toHex(a) {
  return `0x${Buffer.from(a).toString("hex")}`;
}

export function fromHex(a) {
  return Buffer.from(a.replace(/^0x/, ""), "hex");
}

export function toJson(o) {
  return `${JSON.stringify(o, undefined, 2)}\n`;
}
