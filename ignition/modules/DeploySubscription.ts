import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// --- SEPOLIA CONFIGURATION ---
// The confirmed Sepolia PYUSD token address.
const SEPOLIA_PYUSD_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a08"; 

// --- CONTRACT CONSTANTS ---
// Subscription duration: 30 days in seconds
const THIRTY_DAYS_IN_SECS = 30 * 24 * 60 * 60;
// Subscription fee: 10 PYUSD (using 6 decimals)
const SUBSCRIPTION_FEE = 10_000_000n; 

// --- IGNITION MODULE FOR SEPOLIA DEPLOYMENT ---
export default buildModule("SepoliaDeploySubscription", (m) => {
  // 1. Get the deployer account address from Hardhat config
  const deployer = m.getAccount(0);

  // 2. Deploy the PYUSDSubscription contract (We SKIP deploying the MockPYUSD)
  // Constructor arguments are: PYUSD Address, Fee, Period, Owner
  const subscription = m.contract("PYUSDSubscription", [
    SEPOLIA_PYUSD_ADDRESS,      // 1. _pyusdAddress (Real Sepolia address)
    SUBSCRIPTION_FEE,           // 2. _fee
    BigInt(THIRTY_DAYS_IN_SECS),// 3. _period
    deployer,                   // 4. _initialOwner
  ]);

  // 3. Return the deployed contract Future
  return { subscription }; 
});