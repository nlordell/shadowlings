import { BigNumberish, ethers } from "ethers";
import { Proof } from "zokrates-js";

export const SHADOWLING_ADDRESS = "0xB505c51EAceBB5a0dbdB8ffc4974E052fA66fE4D";
const SHADOWLING_ABI = [
  `function ENTRY_POINT() view returns (address)`,
  `function getShadowling(uint256 commit) view returns (address)`,
  `function execute(uint256 commit, address token, address to, uint256 amount)`,
  `function register(uint256 commit, uint256 saltHash)`,
  `function executeWithRecovery(uint256 commit, uint256 saltHash, address token, address to, uint256 amount, ((uint256, uint256), (uint256[2], uint256[2]), (uint256, uint256)) proof) external returns (bool success)`
];
const SHADOWLING = new ethers.Interface(SHADOWLING_ABI);

export const shadowling = (provider?: ethers.Provider): ethers.Contract => new ethers.Contract(
    SHADOWLING_ADDRESS,
    SHADOWLING,
    provider
)

export const encodeExecute = (
  commit: string,
  token: string,
  to: string,
  amount: BigNumberish
): string => {
  return SHADOWLING.encodeFunctionData("execute", [
    commit,
    token,
    to,
    amount,
  ]);
};

export const encodeRegister = (
  commit: string,
  saltHash: string
): string => {
  return SHADOWLING.encodeFunctionData("register", [
    commit,
    saltHash
  ]);
};

export const encodeRecovery = (
  commit: string,
  saltHash: string,
  token: string,
  to: string,
  amount: BigNumberish,
  proof: Proof
): string => {
const p: any = proof.proof;
  return SHADOWLING.encodeFunctionData("executeWithRecovery", [
    commit,
    saltHash,
    token,
    to,
    amount,
    [p.a, p.b, p.c]
  ]);
};
