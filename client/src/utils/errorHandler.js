/**
 * Parse blockchain errors and return user-friendly error messages
 * @param {Error} error - The error object from the blockchain transaction
 * @returns {string} - User-friendly error message
 */
export function parseBlockchainError(error) {
  if (!error) return "Unknown error occurred";
  
  const errorMessage = error.message || error.toString();
  
  // Common MetaMask/wallet errors
  if (errorMessage.includes("user rejected transaction")) {
    return "Transaction was rejected in your wallet";
  }
  
  // Specific contract errors
  if (errorMessage.includes("already voted")) {
    return "You have already cast a vote in this election";
  }
  
  if (errorMessage.includes("missing revert data")) {
    return "Transaction was rejected by the contract. You may have already voted or don't have permission to vote";
  }
  
  if (errorMessage.includes("insufficient funds")) {
    return "Your wallet doesn't have enough ETH to cover the transaction fee";
  }
  
  if (errorMessage.includes("nonce")) {
    return "Transaction error: nonce mismatch. Please refresh the page and try again";
  }
  
  if (errorMessage.includes("gas limit")) {
    return "Transaction failed: gas estimation failed. The contract may have rejected your request";
  }
  
  // Network issues
  if (errorMessage.includes("network") || errorMessage.includes("connection")) {
    return "Network error: please check your internet connection or try another network";
  }
  
  // Fallback for other errors
  return `Transaction failed: ${errorMessage.substring(0, 150)}${errorMessage.length > 150 ? '...' : ''}`;
}

/**
 * Handle voting errors specifically
 * @param {Error} error - The error from the voting transaction
 * @returns {Object} - Object containing error message and recommended action
 */
export function handleVotingError(error) {
  const message = parseBlockchainError(error);
  let action = "Please try again or contact support.";
  let severity = "error"; // could be "error", "warning", "info"
  
  if (message.includes("already voted")) {
    action = "You can only vote once in this election.";
    severity = "warning";
  } else if (message.includes("rejected in your wallet")) {
    action = "You need to confirm the transaction in your wallet to vote.";
    severity = "info";
  } else if (message.includes("enough ETH")) {
    action = "Please add funds to your wallet to cover the transaction fee.";
    severity = "warning";
  }
  
  return {
    message,
    action,
    severity
  };
}
