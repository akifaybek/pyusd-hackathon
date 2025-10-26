import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

// .env'den private key'i al - farklı isimleri dene
const PRIVATE_KEY = (process.env.PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || "0x6ad5542c50676e87b02e5f7cce878500be8fbb5f57418a9a3f4d3af2a4711345") as `0x${string}`;
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

if (!PRIVATE_KEY || PRIVATE_KEY === "") {
  throw new Error("PRIVATE_KEY not found in .env file!");
}

const MOCK_PYUSD_ADDRESS = "0x3eC192dF723833621108F6769A32B4E0a18AB0A8" as `0x${string}`; // ESKİ MockPYUSD (Subscription contract bunu kullanıyor)
const SUBSCRIPTION_ADDRESS = "0x1E2Cb1cEBD00485D02461EeB532AFb19F50898E0" as `0x${string}`;

// ABIs
const MOCK_PYUSD_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

const SUBSCRIPTION_ABI = [
  {
    inputs: [],
    name: "subscribe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "_subscriber", type: "address" }],
    name: "isSubscriberActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log("Signer address:", account.address);

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL),
  });

  // Subscription contract hangi token kullanıyor?
  console.log("\n0. Checking subscription contract's token address...");
  const contractTokenAddress = await publicClient.readContract({
    address: SUBSCRIPTION_ADDRESS,
    abi: [
      {
        inputs: [],
        name: "pyusdToken",
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      }
    ] as const,
    functionName: "pyusdToken",
  });
  console.log("Contract's PYUSD Token:", contractTokenAddress);
  console.log("Our MockPYUSD:", MOCK_PYUSD_ADDRESS);
  
  if (contractTokenAddress.toLowerCase() !== MOCK_PYUSD_ADDRESS.toLowerCase()) {
    console.log("⚠️  WARNING: Contract is using a DIFFERENT token address!");
    console.log("⚠️  You need to redeploy Subscription contract with the correct MockPYUSD address!");
  }

  console.log("\n1. Checking balance...");
  const balance = await publicClient.readContract({
    address: MOCK_PYUSD_ADDRESS,
    abi: MOCK_PYUSD_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("Balance:", formatUnits(balance, 6), "PYUSD");

  console.log("\n2. Approving...");
  const approveTx = await walletClient.writeContract({
    address: MOCK_PYUSD_ADDRESS,
    abi: MOCK_PYUSD_ABI,
    functionName: "approve",
    args: [SUBSCRIPTION_ADDRESS, parseUnits("10", 6)],
  });
  console.log("✅ Approve TX sent:", approveTx);
  console.log("Waiting for confirmation...");
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log("✅ Approved!");

  // Allowance'ı kontrol et
  console.log("\n2.5. Checking allowance...");
  const allowance = await publicClient.readContract({
    address: MOCK_PYUSD_ADDRESS,
    abi: [
      {
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" }
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function"
      }
    ] as const,
    functionName: "allowance",
    args: [account.address, SUBSCRIPTION_ADDRESS],
  });
  console.log("Allowance:", formatUnits(allowance, 6), "PYUSD");

  console.log("\n3. Subscribing...");
  const subscribeTx = await walletClient.writeContract({
    address: SUBSCRIPTION_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "subscribe",
  });
  console.log("✅ Subscribe TX sent:", subscribeTx);
  console.log("Waiting for confirmation...");
  await publicClient.waitForTransactionReceipt({ hash: subscribeTx });
  console.log("✅ Subscribed!");

  console.log("\n4. Checking subscription status...");
  const isActive = await publicClient.readContract({
    address: SUBSCRIPTION_ADDRESS,
    abi: SUBSCRIPTION_ABI,
    functionName: "isSubscriberActive",
    args: [account.address],
  });
  console.log("Is Active:", isActive);

  if (isActive) {
    console.log("\n🎉 SUCCESS! You are now subscribed!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

