// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockPYUSD
 * @notice A mock ERC-20 contract designed to simulate the PayPal USD (PYUSD) token
 * for testing purposes during the ETHGlobal Hackathon.
 * @dev CRITICAL: The contract is configured with 6 decimals to match the behavior of
 * the real PYUSD token, which is essential for accurate fee calculations.
 */
contract MockPYUSD is ERC20, Ownable {
    
    /**
     * @notice Constructor initializes the token and mints an initial supply to the deployer.
     * @dev Sets the deployer as the "owner" and gives the token the name "Mock PayPal USD"
     * and symbol "mPYUSD".
     * @param initialOwner The address designated as the contract owner.
     */
    constructor(address initialOwner) ERC20("Mock PayPal USD", "mPYUSD") Ownable(initialOwner) {
        // Mint an initial supply of 1,000,000 mPYUSD to the deployer (owner) for testing ease.
        // Amount calculation: 1,000,000 * (10 ** 6) = 1,000,000,000,000
        _mint(msg.sender, 1_000_000 * (10 ** decimals()));
    }

    /**
     * @notice Overrides the default ERC-20 decimals to match the real PYUSD token.
     * @dev The real PYUSD token uses 6 decimals (standard ERC-20 default is 18).
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Allows the contract owner to mint new tokens and send them to any address.
     * @dev This is a utility function exclusively for testing and development setup.
     * Can only be called by the contract owner (using `onlyOwner` modifier).
     * @param to The recipient address.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}