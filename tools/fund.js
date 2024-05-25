import { program } from "commander";
import { ethers } from "ethers";

const options = program
  .name("shadowlings-fund")
  .requiredOption("--to <address>", "The amount to transfer")
  .requiredOption("--amount <value>", "The recipient of the transfer")
  .parse()
  .opts();

async function main() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const signer = await provider.getSigner();

  const to = ethers.getAddress(options.to);
  const value = ethers.parseEther(options.amount);

  const transaction = await signer.sendTransaction({ to, value });
  const receipt = await transaction.wait();

  console.log(receipt);
}

main().catch((err) => console.error(err));
