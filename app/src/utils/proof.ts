import { ethers } from "ethers";
import mainArtifactJson from "../config/main/artifacts.json";
import mainKeypairJson from "../config/main/keypair.json";
import { Abi, CompilationArtifacts, Proof, initialize } from "zokrates-js";
import { buildMimcSponge, MimcSponge } from "circomlibjs";
import exp from "constants";

var mimc: MimcSponge | undefined

const globalMimc = async (): Promise<MimcSponge> => {
    if (!mimc)
        mimc = await buildMimcSponge()
    return mimc
}

export const hash = async(...parts: string[]): Promise<string> => {
    const mimc = await globalMimc()
    return `0x${mimc.F.toString(mimc.multiHash(parts), 16)}`
}

export function fromHex(a: string) {
  return Buffer.from(a.replace(/^0x/, ""), "hex");
}

export const calculateCommit = async (owner: string, entropy: string, salt: string, pepper: string = "0x2a"): Promise<{
    ownerHash: string, saltHash: string, commit: string
}> => {
    const ownerHash = await hash(owner, ethers.hexlify(ethers.toUtf8Bytes(entropy)))
    const saltHash = await  hash(salt, pepper)
    return {
        ownerHash,
        saltHash,
        commit: await hash(ownerHash, saltHash)
    }
}

interface PersistedArtifact {
  program: string;
  abi: Abi;
}

export function toFieldElement(x: string) {
  return BigInt(x).toString();
}

const loadMainProvingKey = (): Uint8Array => {
  return ethers.getBytes(mainKeypairJson.pk);
};

const loadPersistedMainArtifacts = (): PersistedArtifact => {
  return mainArtifactJson as any;
};

const loadMainArtifact = (): CompilationArtifacts => {
  const persisted = loadPersistedMainArtifacts();
  return {
    program: fromHex(persisted.program),
    abi: persisted.abi,
  };
};

/*
  public field expected_commit_hash,
    public field expected_nullifier_hash,
    public field execution_hash,
    private field owner_hash,
    private field salt
    */
export const createWithdrawData = async (
  owner: string,
  entropy: string,
  salt: string,
  token: string,
  target: string,
  amount: bigint
): Promise<{ proof: Proof, userOp: string }> => {
  const zok = await initialize();
  const provingKey = loadMainProvingKey();
  const artifact = loadMainArtifact();
  const { saltHash, ownerHash, commit } = await calculateCommit(owner, entropy, salt)
  // TODO: do the real shit
  const executionHash = await hash(token, target, ethers.toBeHex(amount), commit)
  const nullifier = await hash(executionHash, saltHash);
  const { witness } = zok.computeWitness(artifact, [
    commit, nullifier, executionHash, ownerHash, salt
  ].map(toFieldElement));
  const proof = zok.generateProof(artifact.program, witness, provingKey);
  console.log(proof);
  return {
    proof,
    userOp: ""
  }
};
