# PYUSD "Pay-as-you-Go" Subscription Protocol (ETHGlobal Hackathon Project)

_A decentralized subscription solution for Web3 applications, enabling flexible, user-friendly, pay-as-you-go models powered by PYUSD on the Sepolia testnet._

---

## 🚀 The Problem

Current digital subscription models (e.g., video/music streaming, SaaS) are often based on fixed monthly or annual fees. This leads to several issues:

* **Subscription Fatigue:** Users struggle to track and manage numerous subscriptions.
* **Paying for Unused Time:** Users are forced to pay the full fee even for days or weeks they don't actively use the service. For instance, paying for a whole month when the service was only used for a few days. *(It's estimated users might overspend significantly annually due to inactive subscriptions).*
* **Cancellation Difficulties:** Cancelling subscriptions can sometimes be complex and time-consuming.
* **Unpredictable Expenses:** Auto-renewing subscriptions can lead to unexpected charges exceeding users' budgets.

---

## ✨ Our Solution: Pay-as-you-Go with PYUSD

Our project offers a decentralized solution to these problems using **PayPal USD (PYUSD)** stablecoin on the **Sepolia testnet**:

* **User-Controlled Subscriptions:** Users initiate subscriptions via an on-chain transaction (`subscribe`) only after granting specific approval (`approve`) to our contract. Funds are pulled from the user's wallet only when they subscribe.
* **Transparent Access Control:** Access to services is gated by a simple, gas-less on-chain check (`isSubscriberActive`), ensuring users only access content while their subscription is valid based on the `expiresAt` timestamp.
* **Full User Control:** Funds remain in the user's wallet until they explicitly subscribe. Service providers cannot withdraw funds without permission or when the subscription is inactive.
* **Transparency:** All subscription and payment transactions occur on the Sepolia testnet, verifiable by anyone using explorers like Etherscan or Blockscout.
* **Flexibility for Dapps:** Web3 applications (DeFi, GameFi, content platforms, etc.) can easily integrate this protocol to offer their users a fair and transparent subscription model.

---

## 🤔 How It Works

Our protocol follows a simple flow on the **Sepolia Testnet**:

1.  **Connect Wallet:** The user connects their Web3 wallet (e.g., MetaMask) configured for the Sepolia testnet to our frontend application.
2.  **Check Status:** The application reads the user's current subscription status (`isSubscriberActive` from our contract) and their Sepolia PYUSD balance (`balanceOf` from the official PYUSD contract).
3.  **Grant Approval (`approve`):** Before the first subscription, the user interacts with the **official Sepolia PYUSD token contract** (`0x1c7d...`) to grant permission (`approve`) for our subscription contract (`0xEAce...`) to spend the required subscription fee (e.g., 10 PYUSD) on their behalf. This is a standard ERC20 security step.
4.  **Subscribe (`subscribe`):** The user clicks the "Subscribe" button on the frontend. This calls the `subscribe()` function on **our deployed `PYUSDSubscription` contract** (`0xEAce...`). The contract verifies the approval, pulls the fee using `transferFrom` from the user's wallet to the contract, and activates the subscription by setting an `expiresAt` timestamp. A `SubscriptionUpdated` event is emitted.
5.  **Access Control:** The frontend (or a backend service) checks if the user's subscription is valid by calling the gas-less `isSubscriberActive(userAddress)` view function on our contract (`0xEAce...`) whenever the user attempts to access protected content. Access is granted only if the current time is before the user's `expiresAt` timestamp.
6.  **Renewal:** If a user calls `subscribe()` again while their subscription is still active, the new subscription period is added on top of their remaining time. If their subscription has expired, a new period starts from the current time.

---

## 🛠️ Technologies Used

* **Blockchain:** Ethereum (Sepolia Testnet)
* **Stablecoin:** PayPal USD (PYUSD) on Sepolia (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a08`)
* **Smart Contract Development:** Solidity `0.8.28`
* **Development Framework:** Hardhat `3.x`
* **Ethereum Library (Backend):** Viem
* **Testing:** Hardhat (Solidity Tests using `forge-std`)
* **Deployment:** Hardhat Ignition
* **Frontend Framework:** React `18.x` + TypeScript (developed by Hakan)
* **Frontend Build Tool:** Vite (developed by Hakan)
* **Ethereum Library (Frontend):** Wagmi `2.x` (built on Viem) (developed by Hakan)
* **Wallet Connection UI:** ConnectKit (developed by Hakan)
* **Other:** Node.js, Git, GitHub, `dotenv`

---

## 📍 Deployed Contract & Token (Sepolia)

* **PYUSDSubscription Contract:** [`0x1E2Cb1cEBD00485D02461EeB532AFb19F50898E0`](https://sepolia.etherscan.io/address/0x1E2Cb1cEBD00485D02461EeB532AFb19F50898E0)
    * Verified on Blockscout: [`https://eth-sepolia.blockscout.com/address/0x1E2Cb1cEBD00485D02461EeB532AFb19F50898E0#code`](https://eth-sepolia.blockscout.com/address/0x1E2Cb1cEBD00485D02461EeB532AFb19F50898E0#code)
    * *(Verification on Etherscan pending due to API key issue)*
* **MockPYUSD Token (for testing):** [`0xCA0d1c98DA8360466b6193194A28CE5DE9Eb4B71`](https://sepolia.etherscan.io/token/0xCA0d1c98DA8360466b6193194A28CE5DE9Eb4B71)

---

## 🏁 Getting Started (Running the Frontend)

### Prerequisites

* Node.js (v22 or later recommended)
* npm (v10 or later recommended)
* Git
* A Web3 wallet like MetaMask configured for **Sepolia Testnet**.
* **Sepolia ETH:** You need some Sepolia ETH for gas fees. Get some from a faucet like [sepoliafaucet.com](https://sepoliafaucet.com/) or Alchemy's Sepolia Faucet.
* **Sepolia PYUSD:** You need test PYUSD tokens to subscribe. Get them from the Google Cloud Faucet:
    * Go to: [`https://cloud.google.com/web3/faucet/ethereum/sepolia`](https://cloud.google.com/web3/faucet/ethereum/sepolia)
    * Select "Ethereum Sepolia (PYUSD)" from the network dropdown.
    * Enter your Sepolia wallet address and request tokens.
    * Add the PYUSD token address (`0x1c7D...`) to your MetaMask to see your balance.

### Installation & Running Steps

1.  Clone the repository:
    ```bash
    git clone [https://github.com/akifaybek/pyusd-hackathon.git](https://github.com/akifaybek/pyusd-hackathon.git)
    cd pyusd-hackathon
    ```
2.  Install backend dependencies (needed for type generation, etc., even if only running frontend):
    ```bash
    npm install
    ```
3.  Install frontend dependencies:
    ```bash
    cd frontend 
    npm install
    ```
4.  Start the frontend development server:
    ```bash
    # Make sure you are inside the 'frontend' directory
    npm run dev 
    ```
5.  Open the localhost URL provided by Vite (usually `http://localhost:5173`) in your browser.
6.  Ensure your MetaMask wallet is connected to the **Sepolia** network.
7.  Connect your wallet using the button on the Dapp.
8.  Follow the steps on the Dashboard:
    * **Approve:** Grant permission to our contract (`0xEAce...`) to spend PYUSD from the official PYUSD contract (`0x1c7d...`).
    * **Subscribe:** Call the `subscribe()` function on our contract (`0xEAce...`).

---

## 🏆 Hackathon Prizes Targeted

This project aims for the following ETHGlobal Hackathon prizes:

* **PayPal USD Prize:** By utilizing PYUSD for a user-controlled subscription model using `approve` and `transferFrom` ("pull payment") as an alternative to fixed fees, we aim for the **Best Consumer-Focused Payments Experience** or **Most Innovative Use Case**. Our solution demonstrates the potential of PYUSD for programmable, transparent subscriptions, enhancing user control.
* **Hardhat Prize:** The project's backend is fully developed using **Hardhat 3** and **Viem**. Contract deployment is managed via **Hardhat Ignition**. Comprehensive **Solidity tests** (`.t.sol`) leveraging Foundry's cheatcodes (via Hardhat) including time manipulation (`vm.warp`) and error checking (`vm.expectRevert`, custom errors) ensure contract reliability.
* **Blockscout Prize:** Our smart contract deployed to Sepolia has been **verified on Blockscout**, enhancing the project's transparency and trustworthiness.

---

## 🧑‍💻 The Team

* **Akif Aybek** ([GitHub Profile](https://github.com/akifaybek)) - Backend & Smart Contract Developer
* **Hakan Akar** ([GitHub Profile](https://github.com/ahakanakar)) - Frontend & UX Developer

---

## ⏭️ Next Steps & Future Vision

This hackathon project serves as a proof-of-concept. Future development could include:

* **Mainnet PYUSD Integration:** Adapting the contract for mainnet deployment.
* **Variable Subscription Periods:** Adding flexibility for different durations.
* **Streaming Payments:** Implementing per-second PYUSD streaming (e.g., using Superfluid) based on active usage.
* **Subscription Management:** Functions for pausing, canceling, or viewing detailed subscription history.
* **Service Provider Features:** An interface for Dapps to manage their subscription offerings (fees, periods).
* **Multi-Chain Support:** Expanding to other chains where PYUSD is available.