import { ethers } from "ethers";
import { SHADOWLING_ADDRESS } from "./invoker";

const RPC_URL = "http://localhost:8545";
const CORS_URL = "https://corsproxy.io/?" + encodeURIComponent(RPC_URL);

var provider: ethers.Provider | undefined;

export const globalProvier = (): ethers.Provider => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
};

const REGISTER_TOPIC =
  "0xf59eb4b970a508b6ce525562982957de66286828bcbbcf770f802c8fad2d575b";

export const queryRecoveryRegistrations = async (
  shadow: string,
): Promise<string | undefined> => {
  const p = globalProvier();
  const logs = await p.getLogs({
    address: SHADOWLING_ADDRESS,
    topics: [
      REGISTER_TOPIC,
      ethers.zeroPadValue(shadow, 32),
    ],
    fromBlock: "earliest",
    toBlock: "latest",
  });
  if (logs.length == 0) return undefined;
  return logs[0].data;
};
