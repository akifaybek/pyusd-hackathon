import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// --- Configuration Constants for LOCAL Deployment ---
// These values can be easily adjusted here for local testing.

// Subscription duration: 30 days in seconds
const THIRTY_DAYS_IN_SECS: number = 30 * 24 * 60 * 60;

// Subscription fee: 10 MockPYUSD
// NOTE: Assumes MockPYUSD uses 6 decimals, just like real PYUSD.
// 10 * (10 ** 6) = 10,000,000
// The 'n' suffix denotes a BigInt, the standard for large numbers in modern JS/TS.
const SUBSCRIPTION_FEE: bigint = 10_000_000n;

// --- Ignition Module Definition for LOCAL Deployment ---
// This module defines the deployment steps for a local Hardhat network.
// It deploys both the MockPYUSD and the PYUSDSubscription contract.
// For deploying to a testnet like Sepolia, a different module is used
// which utilizes the real PYUSD address instead of deploying the mock.

export default buildModule("DeploySubscriptionModule", (m) => {
  // 1. Get the deployer account address (usually the first account from Hardhat network)
  const deployer = m.getAccount(0);

  // 2. Deploy the MockPYUSD contract first.
  // We pass the deployer address as the 'initialOwner' argument to its constructor.
  const mockPYUSD = m.contract("MockPYUSD", [deployer]);
  console.log("MockPYUSD deployment future created."); // Log for clarity

  // 3. Deploy the PYUSDSubscription contract next.
  // Provide the required arguments to its constructor in order:
  const subscription = m.contract("PYUSDSubscription", [
    mockPYUSD, // 1. _pyusdAddress: Pass the Future object of the mock token. Ignition resolves this to the deployed address.
    SUBSCRIPTION_FEE, // 2. _fee: Use the configured fee.
    BigInt(THIRTY_DAYS_IN_SECS), // 3. _period: Use the configured duration (cast to BigInt).
    deployer, // 4. _initialOwner: Set the deployer as the owner.
  ]);
  console.log("PYUSDSubscription deployment future created, depends on MockPYUSD."); // Log dependency

  // 4. Return the Futures representing the deployed contracts.
  // This allows accessing their deployed addresses later (e.g., in tests or scripts).
  console.log("Returning futures for MockPYUSD and PYUSDSubscription.");
  return { mockPYUSD, subscription };
});