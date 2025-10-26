import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = (process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || "0x6ad5542c50676e87b02e5f7cce878500be8fbb5f57418a9a3f4d3af2a4711345") as `0x${string}`;
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const MOCK_PYUSD_ADDRESS = "0x3eC192dF723833621108F6769A32B4E0a18AB0A8" as `0x${string}`;

// YENİ HESABINIZIN ADRESİNİ BURAYA YAPIŞTIRIN
const NEW_ACCOUNT_ADDRESS = "0xYOUR_NEW_ADDRESS_HERE" as `0x${string}`;

const MOCK_PYUSD_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("From:", account.address);
  console.log("To:", NEW_ACCOUNT_ADDRESS);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  console.log("\nSending 100 PYUSD...");
  const tx = await walletClient.writeContract({
    address: MOCK_PYUSD_ADDRESS,
    abi: MOCK_PYUSD_ABI,
    functionName: "transfer",
    args: [NEW_ACCOUNT_ADDRESS, parseUnits("100", 6)],
  });

  console.log("TX sent:", tx);
  console.log("Waiting for confirmation...");
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log("✅ 100 PYUSD sent successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

