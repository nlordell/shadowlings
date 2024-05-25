import { ethers } from "ethers";

import BROADCAST from "../contracts/broadcast/Shadowlings.s.sol/1337/run-latest.json" with {
  type: "json",
};

async function main() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const signer = await provider.getSigner();

  const { contractAddress, transaction } = BROADCAST.transactions[0];

  await signer.sendTransaction({
    to: "0x851fBEeaedBcbB9FbF0BF9be02eDC82deD31A225",
    value: ethers.parseEther("0.1"),
  });
  await signer.sendTransaction({
    to: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    data:
      "0xb760faf90000000000000000000000003f921430daab41807d7013b7f4d4c3a37fe58142",
    value: ethers.parseEther("0.1"),
  });

  if (await provider.getCode(contractAddress) !== "0x") {
    console.log(`already deployed to ${contractAddress}`);
    return;
  }

  const deployment = await signer.sendTransaction({
    to: BROADCAST.transactions[0].transaction.to,
    data: BROADCAST.transactions[0].transaction.input,
  });
  const receipt = await deployment.wait();

  console.log(deployment);
}

main().catch((err) => console.error(err));
