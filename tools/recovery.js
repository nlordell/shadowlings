import { Command, program } from "commander";
import { ethers } from "ethers";
import { promises as fs } from "fs";
import { initialize } from "zokrates-js";

import { buildMimcHasher, fromHex, toFieldElement } from "../circuits/util.js";

const registerCommand = new Command("register")
  .description("Register a salt hash publically for recovery")
  .option("--shadowlings <address>", "The Shadowlings contract address")
  .requiredOption("--owner <address>", "The owner of the shadowling")
  .option(
    "--entropy <value>",
    "Additional entropy for preserving privacy with recovery",
  )
  .requiredOption("--salt <value>", "The shadowling specific salt")
  .option("--rpc-url <url>", "The RPC URL, defaulting to public Otim instance")
  .option("--bundler-url <url>", "The ERC-4337 bundler URL")
  .action(register);
const recoverCommand = new Command("recover")
  .description("Print out recovery transaction to be executed by the owner")
  .option("--shadowlings <address>", "The Shadowlings contract address")
  .requiredOption("--owner <address>", "The owner of the shadowling")
  .option(
    "--entropy <value>",
    "Additional entropy for preserving privacy with recovery",
  )
  .requiredOption("--salt-hash <value>", "The shadowling specific salt hash")
  .option("--token <address>", "The token to transfer (empty for Ether)")
  .requiredOption("--to <address>", "The amount to transfer")
  .requiredOption("--amount <value>", "The recipient of the transfer")
  .option("--rpc-url <url>", "The RPC URL, defaulting to public Otim instance")
  .action(recover);

async function register(options) {
  const owner = ethers.getAddress(options.owner);
  const entropy = BigInt(options.entropy ?? 0);
  const salt = BigInt(options.salt);
  const pepper = 42;

  const provider = new ethers.JsonRpcProvider(
    options.rpcUrl ?? "http://localhost:8545",
  );
  const bundler = new Bundler(
    options.bundlerUrl ?? "http://localhost:3000/rpc",
  );

  const shadowlings = new ethers.Contract(
    options.shadowlings ?? "0xB505c51EAceBB5a0dbdB8ffc4974E052fA66fE4D",
    [
      `function ENTRY_POINT() view returns (address)`,
      `function getShadowling(uint256 commit) view returns (address)`,
      `function register(uint256 commit, uint256 saltHash)`,
    ],
    provider,
  );
  const entryPoint = new ethers.Contract(
    await shadowlings.ENTRY_POINT(),
    [
      `function getUserOpHash(
        (
          address sender,
          uint256 nonce,
          bytes initCode,
          bytes callData,
          bytes32 accountGasLimits,
          uint256 preVerificationGas,
          bytes32 gasFees,
          bytes paymasterAndData,
          bytes signature
        ) userOp
      ) view returns (bytes32)`,
      `function getNonce(address sender, uint192 key) view returns (uint256 nonce)`,
      `function balanceOf(address sender) view returns (uint256 amount)`,
    ],
    provider,
  );

  const mimc = await buildMimcHasher();

  const ownerHash = mimc(owner, entropy);
  const saltHash = mimc(salt, pepper);
  const commit = mimc(ownerHash, saltHash);
  const shadowling = await shadowlings.getShadowling(commit);

  const userOp = {
    sender: await shadowlings.getAddress(),
    nonce: await entryPoint.getNonce(
      await shadowlings.getAddress(),
      shadowling,
    ),
    callData: shadowlings.interface.encodeFunctionData("register", [
      commit,
      saltHash,
    ]),
    verificationGasLimit: 500000,
    callGasLimit: 100000,
    preVerificationGas: 100000,
    maxPriorityFeePerGas: ethers.parseUnits("1", 9),
    maxFeePerGas: ethers.parseUnits("10", 9),
  };
  const packedUserOp = {
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: "0x",
    callData: userOp.callData,
    accountGasLimits: packGas(userOp.verificationGasLimit, userOp.callGasLimit),
    preVerificationGas: userOp.preVerificationGas,
    gasFees: packGas(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas),
    paymasterAndData: "0x",
    signature: "0x",
  };
  const userOpHash = await entryPoint.getUserOpHash(packedUserOp);

  const executionHash = fieldify(userOpHash);
  const nullifier = mimc(executionHash, saltHash);

  const proof = await proove(
    "register",
    commit,
    nullifier,
    executionHash,
    saltHash,
    ownerHash,
    salt,
  );
  const signature = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "uint256",
      "tuple(uint256[2], uint256[2][2], uint256[2])",
    ],
    [nullifier, [proof.a, proof.b, proof.c]],
  );

  console.log({ ...userOp, signature });
  await bundler.sendUserOperation(
    { ...userOp, signature },
    await entryPoint.getAddress(),
  );

  let userOpReceipt;
  while (!userOpReceipt) {
    userOpReceipt = await bundler.getUserOperationByHash(userOpHash);
  }
  const transactionReceipt = await provider.getTransactionReceipt(
    userOpReceipt.transactionHash,
  );
  console.log({
    userOpReceipt,
    transactionReceipt,
    logs: transactionReceipt.logs,
  });
}

async function recover(options) {
  const owner = ethers.getAddress(options.owner);
  const entropy = BigInt(options.entropy ?? 0);
  const saltHash = BigInt(options.saltHash);
  const token = ethers.getAddress(options.token ?? ethers.ZeroAddress);
  const to = ethers.getAddress(options.to);
  const amount = ethers.parseEther(options.amount);

  const provider = new ethers.JsonRpcProvider(
    options.rpcUrl ?? "http://localhost:8545",
  );

  const shadowlings = new ethers.Contract(
    options.shadowlings ?? "0xB505c51EAceBB5a0dbdB8ffc4974E052fA66fE4D",
    [
      `function getShadowling(uint256 commit) view returns (address)`,
      `function executeWithRecovery(
        uint256 commit,
        uint256 saltHash,
        address token,
        address to,
        uint256 amount,
        (
          (uint256, uint256),
          (uint256[2], uint256[2]),
          (uint256, uint256)
        ) proof
      )`,
    ],
    provider,
  );

  const mimc = await buildMimcHasher();

  const ownerHash = mimc(owner, entropy);
  const commit = mimc(ownerHash, saltHash);

  const shadowling = await shadowlings.getShadowling(commit);
  const balance = `${
    ethers.formatEther(await provider.getBalance(shadowling))
  } ETH`;
  console.log({ shadowling, balance });

  const proof = await proove(
    "recovery",
    commit,
    owner,
    saltHash,
    entropy,
  );

  const transactionData = {
    from: owner,
    to: await shadowlings.getAddress(),
    data: shadowlings.interface.encodeFunctionData("executeWithRecovery", [
      commit,
      saltHash,
      token,
      to,
      amount,
      [proof.a, proof.b, proof.c],
    ]),
  };

  await provider.call(transactionData);
  console.log(transactionData);
}

async function main() {
  await program
    .name("shadowlings-recovery")
    .addCommand(registerCommand)
    .addCommand(recoverCommand)
    .parseAsync();

  return;
}

async function circuit(name) {
  const artifacts = JSON.parse(
    await fs.readFile(
      `./app/src/config/${name}/artifacts.json`,
      "utf-8",
    ),
  );
  const keypair = JSON.parse(
    await fs.readFile(
      `./app/src/config/${name}/keypair.json`,
      "utf-8",
    ),
  );
  return {
    artifacts: { ...artifacts, program: fromHex(artifacts.program) },
    keypair: { ...keypair, pk: fromHex(keypair.pk) },
  };
}

async function proove(name, ...inputs) {
  const zokrates = await initialize();
  const { artifacts, keypair } = await circuit(name);
  const { witness } = zokrates.computeWitness(
    artifacts,
    inputs.map(toFieldElement),
  );
  const proof = zokrates.generateProof(
    artifacts.program,
    witness,
    keypair.pk,
  );

  if (!zokrates.verify(keypair.vk, proof)) {
    throw new Error("error locally verifying proof");
  }

  return proof.proof;
}

class Bundler {
  #url;
  #id;

  constructor(url) {
    this.#url = url;
    this.#id = 0;
  }

  async supportedEntryPoints() {
    return await this.send("eth_supportedEntryPoints", []);
  }

  async sendUserOperation(userOp, entryPoint) {
    return await this.send("eth_sendUserOperation", [
      this.jsonUserOp(userOp),
      entryPoint,
    ]);
  }

  async getUserOperationByHash(userOpHash) {
    return await this.send("eth_getUserOperationByHash", [userOpHash]);
  }

  async send(method, params) {
    const response = await fetch(this.#url, {
      method: "POST",
      headers: {
        ["Content-Type"]: "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: this.#id++,
        method,
        params,
      }),
    });
    const { result, error } = await response.json();
    if (error) {
      throw new Error(JSON.stringify(error));
    }
    return result;
  }

  jsonUserOp(userOp) {
    const result = {
      sender: ethers.getAddress(userOp.sender),
      nonce: ethers.toBeHex(userOp.nonce),
      callData: ethers.hexlify(userOp.callData),
      callGasLimit: ethers.toBeHex(userOp.callGasLimit),
      verificationGasLimit: ethers.toBeHex(userOp.verificationGasLimit),
      preVerificationGas: ethers.toBeHex(userOp.preVerificationGas),
      maxFeePerGas: ethers.toBeHex(userOp.maxFeePerGas),
      maxPriorityFeePerGas: ethers.toBeHex(userOp.maxPriorityFeePerGas),
      signature: ethers.hexlify(userOp.signature),
    };
    if (userOp.factory) {
      result.factory = ethers.getAddress(userOp.factory);
      result.factoryData = ethers.hexlify(userOp.factoryData);
    }
    if (userOp.paymaster) {
      result.paymaster = ethers.getAddress(userOp.paymaster);
      result.paymasterVerificationGasLimit = ethers.toBeHex(
        userOp.paymasterVerificationGasLimit,
      );
      result.paymasterPostOpGasLimit = ethers.toBeHex(
        userOp.paymasterPostOpGasLimit,
      );
      result.paymasterData = ethers.hexlify(userOp.paymasterData);
    }
    return result;
  }
}

function packGas(hi, lo) {
  return ethers.solidityPacked(["uint128", "uint128"], [hi, lo]);
}

function fieldify(value) {
  return ethers.toBeHex(
    BigInt(value) &
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
  );
}

main().catch((err) => console.error(err));
