# Online Voting System using Blockchain

This project implements a secure, transparent, and tamper-resistant online voting system using blockchain technology. By leveraging Ethereum smart contracts, we ensure the integrity of the electoral process while maintaining voter privacy.

## Features

- **Secure Authentication**: Ensures only eligible voters can participate
- **Vote Privacy**: Preserves the anonymity of voters
- **Tamper-proof Records**: Uses blockchain immutability to prevent vote manipulation
- **Real-time Results**: Provides transparent counting and immediate results
- **Decentralized Architecture**: Eliminates the need for a trusted central authority

## Technologies Used

- **Solidity**: For writing smart contracts
- **Hardhat**: Development environment for Ethereum
- **Ethers.js**: Library for interacting with Ethereum blockchain
- **React.js**: Frontend user interface
- **MetaMask**: For wallet connectivity and transaction signing

## Smart Contract Architecture

The system uses the following smart contracts:
- **ElectionFactory**: Creates and manages election instances
- **Election**: Handles the voting logic for a specific election
- **VoterRegistry**: Manages voter verification and eligibility

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Online-Voting-System-using-blockchain.git
   cd Online-Voting-System-using-blockchain
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile smart contracts:
   ```bash
   npx hardhat compile
   ```

4. Run tests:
   ```bash
   npx hardhat test
   ```

5. Deploy to local network:
   ```bash
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

6. Start the frontend application:
   ```bash
   cd client
   npm install
   npm start
   ```

## Usage

1. Connect your MetaMask wallet to the application
2. Register as a voter (requires verification)
3. Browse available elections
4. Cast your vote securely
5. View election results in real-time

## How It Works

1. Administrators create elections through the ElectionFactory contract
2. Eligible voters are registered in the VoterRegistry
3. Voters authenticate using their blockchain wallet
4. When casting a vote, a transaction is created on the blockchain
5. Smart contracts verify eligibility and prevent double-voting
6. Votes are tallied in real-time with verifiable results

## Security Considerations

- Sybil attack prevention through robust identity verification
- Protection against double voting using smart contract logic
- Transaction privacy to maintain vote secrecy
- DoS protection mechanisms

## Development Commands

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```
