import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MockPYUSDModule", (m) => {
  const deployer = m.getAccount(0);
  
  const mockPYUSD = m.contract("MockPYUSD", [deployer]);
  
  return { mockPYUSD };
});

