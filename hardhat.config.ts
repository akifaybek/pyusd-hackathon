import { HardhatUserConfig } from "hardhat/config";

// Import the necessary plugins into variables
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
// Import ignition explicitly as well, just in case toolbox doesn't load it correctly for tasks
import hardhatIgnitionViem from "@nomicfoundation/hardhat-ignition-viem"; 
// Import verify explicitly too
import hardhatVerify from "@nomicfoundation/hardhat-verify";

// dotenv'i import et ve HEMEN çağır
import dotenv from "dotenv";
dotenv.config();

// Değişkenleri doğrudan process.env'den al
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const accounts = SEPOLIA_PRIVATE_KEY !== "" ? [SEPOLIA_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  // Import edilen plugin değişkenlerini buraya ekle
  plugins: [
    hardhatToolboxViem, 
    hardhatIgnitionViem, 
    hardhatVerify,
  ],
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
      type: "edr-simulated"
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: accounts,
      type: "http"
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};

export default config;