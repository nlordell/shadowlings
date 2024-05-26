import { program } from "commander";
import { ethers } from "ethers";

const options = program
  .name("shadowlings-fund")
  .option("--token <address>", "The token to mint")
  .requiredOption("--to <address>", "The amount to transfer")
  .requiredOption("--amount <value>", "The recipient of the transfer")
  .parse()
  .opts();

async function main() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");
  const signer = await provider.getSigner();

  const token = ethers.getAddress(options.token ?? ethers.ZeroAddress);
  const to = ethers.getAddress(options.to);
  const value = ethers.parseEther(options.amount);

  let transactionData;
  if (token === ethers.ZeroAddress) {
    transactionData = { to, value };
  } else {
    transactionData = {
      to: token,
      data: TOKEN.encodeFunctionData("mint", [to, value]),
    };
  }

  const transaction = await signer.sendTransaction(transactionData);
  const receipt = await transaction.wait();

  console.log(receipt);
}

const TOKEN = new ethers.Interface([
  `function mint(address to, uint256 amount)`,
]);

main().catch((err) => console.error(err));
