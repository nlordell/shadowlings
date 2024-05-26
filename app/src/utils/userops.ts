import { BigNumberish, BytesLike, Contract, ethers } from "ethers";
import { SHADOWLING_ADDRESS, shadowling } from "./invoker";
import { globalProvier } from "./web3";

export type UserOperation = {
    sender: string
    nonce: BigNumberish
    factory?: string
    factoryData?: BytesLike
    callData: BytesLike
    callGasLimit: BigNumberish
    verificationGasLimit: BigNumberish
    preVerificationGas: BigNumberish
    maxFeePerGas: BigNumberish
    maxPriorityFeePerGas: BigNumberish
    paymaster?: string
    paymasterVerificationGasLimit?: BigNumberish
    paymasterPostOpGasLimit?: BigNumberish
    paymasterData?: BytesLike
  }

export type SignedUserOperation = UserOperation & {
    signature: string
}

const ENTRYPOINT_ABI = [
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
];

const ENTRYPOINT = new ethers.Interface(ENTRYPOINT_ABI)

export const entrypoint = async (provider: ethers.Provider = globalProvier()): Promise<Contract> => {
    const invoker = shadowling(provider)
    return new Contract(
        await invoker.ENTRY_POINT(),
        ENTRYPOINT,
        provider
    )
}

function packGas(hi: BigNumberish, lo: BigNumberish) {
  return ethers.solidityPacked(["uint128", "uint128"], [hi, lo]);
}

const packUserOp = (userOp: UserOperation) => {
    return {
        sender: userOp.sender,
        nonce: userOp.nonce,
        initCode: "0x",
        callData: userOp.callData,
        accountGasLimits: packGas(userOp.verificationGasLimit, userOp.callGasLimit),
        preVerificationGas: userOp.preVerificationGas,
        gasFees: packGas(userOp.maxPriorityFeePerGas, userOp.maxFeePerGas),
        paymasterAndData: "0x",
        signature: "0x",
      }
}

export const calculateUserOpHash = async (userOp: UserOperation): Promise<string> => {
    const packed = packUserOp(userOp)
    const ep = await entrypoint()
    return await ep.getUserOpHash(packed)
}

export const formatUserOp = (userOp: SignedUserOperation): Record<string, unknown> => {
    const jsonUserOp = {
        sender: ethers.getAddress(userOp.sender),
        nonce: ethers.toBeHex(userOp.nonce),
        callData: ethers.hexlify(userOp.callData),
        callGasLimit: ethers.toBeHex(userOp.callGasLimit),
        verificationGasLimit: ethers.toBeHex(userOp.verificationGasLimit),
        preVerificationGas: ethers.toBeHex(userOp.preVerificationGas),
        maxFeePerGas: ethers.toBeHex(userOp.maxFeePerGas),
        maxPriorityFeePerGas: ethers.toBeHex(userOp.maxPriorityFeePerGas),
        signature: ethers.hexlify(userOp.signature),
      } as Record<string, unknown>
      if (userOp.factory) {
        jsonUserOp.factory = ethers.getAddress(userOp.factory)
        jsonUserOp.factoryData = ethers.hexlify(userOp.factoryData!)
      }
      if (userOp.paymaster) {
        jsonUserOp.paymaster = ethers.getAddress(userOp.paymaster)
        jsonUserOp.paymasterVerificationGasLimit = ethers.toBeHex(userOp.paymasterVerificationGasLimit!)
        jsonUserOp.paymasterPostOpGasLimit = ethers.toBeHex(userOp.paymasterPostOpGasLimit!)
        jsonUserOp.paymasterData = ethers.hexlify(userOp.paymasterData!)
      }
      return jsonUserOp
}

export const buildUserOps = async (shadow: string, callData: string): Promise<UserOperation> => {
    const ep = await entrypoint()
    const nonce = await ep.getNonce(
        SHADOWLING_ADDRESS,
        shadow,
    )
    return {
        sender: SHADOWLING_ADDRESS,
        nonce,
        callData,
        verificationGasLimit: 500000,
        callGasLimit: 100000,
        preVerificationGas: 100000,
        maxPriorityFeePerGas: ethers.parseUnits("1", 9),
        maxFeePerGas: ethers.parseUnits("20", 9)
    }
};


class Bundler {
    private url: string;
    private id: number;
  
    constructor(url: string) {
      this.url = url;
      this.id = 0;
    }
  
    async supportedEntryPoints() {
      return await this.send("eth_supportedEntryPoints", []);
    }
  
    async sendUserOperation(userOp: SignedUserOperation, entryPoint: string) {
      return await this.send("eth_sendUserOperation", [
        formatUserOp(userOp),
        entryPoint,
      ]);
    }
  
    async getUserOperationByHash(userOpHash: string) {
      return await this.send("eth_getUserOperationByHash", [userOpHash]);
    }
  
    async send(method: string, params: Array<unknown>) {
      const response = await fetch(this.url, {
        method: "POST",
        headers: {
          ["Content-Type"]: "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.id++,
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
}

export const globalBundler = new Bundler("http://localhost:3000/rpc")