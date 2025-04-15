import { ethers } from 'ethers';
import Voting from '../artifacts/contracts/Voting.sol/Voting.json';

/**
 * Deploys a new voting contract with the specified candidates
 * @param {Array<string>} candidates - Array of candidate names
 * @returns {Promise<Object>} The deployed contract instance and address
 */
export async function deployVotingContract(candidates) {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }
  
  // Connect to the provider
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Create contract factory
  const factory = new ethers.ContractFactory(
    Voting.abi,
    Voting.bytecode,
    signer
  );
  
  // Deploy contract
  const contract = await factory.deploy(candidates);
  await contract.waitForDeployment();
  
  // Get contract address
  const address = await contract.getAddress();
  
  return {
    contract,
    address
  };
}

/**
 * Verifies if a contract exists at the specified address
 * @param {string} address - Contract address to check
 * @param {ethers.Provider} provider - Ethereum provider
 * @returns {Promise<boolean>} True if contract exists
 */
export async function verifyContractExists(address, provider) {
  try {
    // Check if there's code deployed at the address
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch (err) {
    console.error('Error verifying contract:', err);
    return false;
  }
}
