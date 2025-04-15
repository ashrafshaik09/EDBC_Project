import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Voting from "./artifacts/contracts/Voting.sol/Voting.json";
import "./App.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [transactionPending, setTransactionPending] = useState(false);
  const [theme, setTheme] = useState("light");
  const [votingStatus, setVotingStatus] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [correctNetwork, setCorrectNetwork] = useState(true);
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);

  const contractAddress = "0x8eAEFd58fE0409212cEf256936A0FA2a3006a1fe";
  
  // Default candidates to show when contract loading fails
  const defaultCandidates = [
    { id: 0, name: "Alice", votes: 0 },
    { id: 1, name: "Bob", votes: 0 },
    { id: 2, name: "Charlie", votes: 0 },
    { id: 3, name: "David", votes: 0 },
    { id: 4, name: "Eve", votes: 0 },
  ];

  // Theme toggle functionality
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Setup background animation
  useEffect(() => {
    if (!vantaEffectRef.current && window.VANTA && window.VANTA.WAVES && vantaRef.current) {
      vantaEffectRef.current = window.VANTA.WAVES({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: theme === 'light' ? 0x3f7fef : 0x5327b0,
        shininess: 40,
        waveHeight: 15,
        waveSpeed: 0.75,
        zoom: 0.85
      });
    }

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, [theme]);

  // Wallet connection
  useEffect(() => {
    const connectWallet = async () => {
      setIsLoading(true);
      setNetworkError(false);
      setConnectionError("");
      
      try {
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed");
        }
        
        // Get provider and network info first
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        console.log("Connected to network:", network.name, network.chainId);
        setNetworkName(network.name === 'homestead' ? 'Ethereum Mainnet' : network.name);
        setCorrectNetwork(true);
        
        // Request accounts
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        
        // Create contract instance with error handling
        try {
          const contract = new ethers.Contract(contractAddress, Voting.abi, signer);
          setContract(contract);
          setAccount(accounts[0]);
          
          // Set up event listeners for account/network changes
          window.ethereum.on("accountsChanged", handleAccountsChanged);
          window.ethereum.on("chainChanged", () => window.location.reload());
          
          // Attempt to load candidates and check voting status
          await loadCandidates(contract);
          await checkVotingStatus(contract, accounts[0]);
        } catch (contractErr) {
          console.error("Error setting up contract:", contractErr);
          setConnectionError("Failed to connect to voting contract. Make sure it's deployed correctly.");
          setCandidates(defaultCandidates);
        }
      } catch (err) {
        console.error("Error connecting wallet:", err);
        setConnectionError(`Error connecting to blockchain: ${err.message}`);
        setCandidates(defaultCandidates);
      } finally {
        setIsLoading(false);
      }
    };

    connectWallet();
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);
  
  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // MetaMask is locked or user has no accounts
      setAccount("");
      setHasVoted(false);
    } else {
      // Update the current account
      setAccount(accounts[0]);
      
      // Check if the new account has already voted
      if (contract) {
        await checkVotingStatus(contract, accounts[0]);
      }
    }
  };

  const loadCandidates = async (contract) => {
    if (!contract) return;
    
    try {
      // Try direct getCandidates call first
      try {
        const candidatesList = await contract.getCandidates();
        
        if (candidatesList && candidatesList.length > 0) {
          setCandidates(
            candidatesList.map((c, index) => ({
              id: index,
              name: c.name,
              votes: Number(c.voteCount),
            }))
          );
          console.log("Candidates loaded successfully");
          return;
        }
      } catch (methodErr) {
        console.log("Error calling getCandidates:", methodErr.message);
      }
      
      // Try alternative approach - get candidates one by one
      try {
        const candidatesCount = await contract.getCandidatesCount();
        const count = Number(candidatesCount);
        console.log(`Found ${count} candidates`);
        
        if (count > 0) {
          const candidatesList = [];
          
          for (let i = 0; i < count; i++) {
            try {
              const candidate = await contract.candidates(i);
              candidatesList.push({
                id: i,
                name: candidate.name || `Candidate ${i+1}`,
                votes: Number(candidate.voteCount || 0),
              });
            } catch (err) {
              console.error(`Error loading candidate ${i}:`, err);
            }
          }
          
          if (candidatesList.length > 0) {
            setCandidates(candidatesList);
            return;
          }
        }
      } catch (countErr) {
        console.error("Error getting candidate count:", countErr.message);
      }
      
      // Check contract address for non-existent contract
      try {
        const code = await contract.provider.getCode(contractAddress);
        if (code === "0x") {
          throw new Error("No contract found at the specified address");
        }
      } catch (codeErr) {
        console.error("Error checking contract code:", codeErr);
      }
      
      // If all methods fail, show error and use defaults
      throw new Error("Could not retrieve candidates from the contract");
    } catch (err) {
      console.error("Error loading candidates:", err);
      setConnectionError(`Failed to load candidates: ${err.message}`);
      setCandidates(defaultCandidates);
    }
  };

  const checkVotingStatus = async (contract, address) => {
    if (!contract || !address) return;
    
    try {
      // Try multiple methods to check if user has voted
      
      // Method 1: Try hasVoted mapping if it exists
      try {
        const hasVotedResult = await contract.hasVoted(address);
        console.log(`hasVoted check result for ${address}:`, hasVotedResult);
        setHasVoted(hasVotedResult);
        return;
      } catch (e) {
        console.log("hasVoted method not found, trying alternative");
      }
      
      // Method 2: Try voters mapping if it exists
      try {
        const voterInfo = await contract.voters(address);
        console.log(`voters mapping result for ${address}:`, Boolean(voterInfo));
        setHasVoted(Boolean(voterInfo));
        return;
      } catch (e) {
        console.log("voters mapping not found, trying alternative");
      }
      
      // Method 3: Check past vote events for this address
      try {
        // This requires your contract to emit a Voted event
        const filter = contract.filters.Voted(address);
        const events = await contract.queryFilter(filter);
        const hasVotedFromEvents = events.length > 0;
        console.log(`Vote events found for ${address}:`, events.length);
        setHasVoted(hasVotedFromEvents);
        return;
      } catch (e) {
        console.log("Event filtering not available, last resort");
      }
      
      // Default to not voted if all checks fail
      setHasVoted(false);
    } catch (err) {
      console.error("Error checking voting status:", err);
      setHasVoted(false);
    }
  };

  const voteForCandidate = async (candidateIndex) => {
    if (!contract) {
      setErrorMessage("Wallet not connected properly. Please refresh and try again.");
      setShowErrorModal(true);
      return;
    }
    
    if (hasVoted) {
      setErrorMessage("You have already cast a vote in this election.");
      setShowErrorModal(true);
      return;
    }
    
    setTransactionPending(true);
    setVotingStatus("Processing your vote on the blockchain...");
    setErrorMessage('');
    
    try {
      // Double check if the user has already voted
      try {
        await checkVotingStatus(contract, account);
        if (hasVoted) {
          throw new Error("You have already voted in this election.");
        }
      } catch (checkErr) {
        console.log("Pre-vote check failed, continuing with transaction");
      }
      
      // Send vote transaction with explicit gas limit
      const tx = await contract.vote(candidateIndex, {
        gasLimit: 200000
      });
      
      setVotingStatus("Confirming transaction...");
      await tx.wait();
      
      // Set as voted and reload candidates
      setVotingStatus("Vote successfully recorded on the blockchain!");
      setHasVoted(true);
      await loadCandidates(contract);
    } catch (err) {
      console.error("Error voting:", err);
      
      let errorMsg = "Transaction failed. ";
      
      if (err.message.includes("already voted") || err.message.includes("has already voted")) {
        errorMsg = "You have already voted in this election.";
        // Also set voted to true to prevent further attempts
        setHasVoted(true);
      } else if (err.message.includes("missing revert data")) {
        errorMsg = "Transaction rejected by the contract. You may have already voted or lack voting rights.";
      } else if (err.message.includes("user rejected")) {
        errorMsg = "You rejected the transaction.";
      } else {
        errorMsg += err.message || "Please check your wallet connection and try again.";
      }
      
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
      setVotingStatus("");
    }
    
    setTransactionPending(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      // For local development (Ganache or Hardhat)
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x539" }], // Chain ID 1337 in hex
      });
    } catch (switchError) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x539", // 1337 in hex
              chainName: "Local Blockchain",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: ["http://127.0.0.1:8545"],
              blockExplorerUrls: [""]
            }]
          });
        } catch (addError) {
          console.error("Error adding network:", addError);
        }
      } else {
        console.error("Error switching network:", switchError);
      }
    }
  };

  const formatAddress = (address) => {
    return address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : "";
  };

  const totalVotes = candidates.reduce((sum, candidate) => sum + candidate.votes, 0);

  const handleCandidateSelect = (candidate) => {
    if (!hasVoted && !transactionPending) {
      setSelectedCandidate(candidate);
    }
  };

  const confirmVote = () => {
    if (selectedCandidate !== null) {
      voteForCandidate(selectedCandidate.id);
      setSelectedCandidate(null);
    }
  };

  // Chart data preparation
  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [{
      label: 'Votes',
      data: candidates.map(c => c.votes),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(78, 205, 196, 0.8)',
        'rgba(231, 76, 60, 0.8)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(199, 199, 199, 1)',
        'rgba(83, 102, 255, 1)',
        'rgba(78, 205, 196, 1)',
        'rgba(231, 76, 60, 1)',
      ],
      borderWidth: 1,
    }]
  };

  return (
    <div ref={vantaRef} className="vanta-bg">
      <header className="app-header">
        <h1>Blockchain Voting System</h1>
        <div className="wallet-info">
          <div className="wallet-address">
            {account ? (
              <>
                <div className="wallet-indicator connected"></div>
                <span className="account-text">{formatAddress(account)}</span>
                <span className="vote-status-pill">{hasVoted ? "Voted" : "Not Voted"}</span>
              </>
            ) : (
              <>
                <div className="wallet-indicator disconnected"></div>
                <span>Wallet not connected</span>
              </>
            )}
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>

      <main className="dashboard">
        {isLoading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Connecting to blockchain...</p>
          </div>
        ) : (
          <>
            <section className="stats-section">
              <div className="stat-card">
                <h3>Total Votes</h3>
                <p className="stat-value">{totalVotes}</p>
              </div>
              <div className="stat-card">
                <h3>Candidates</h3>
                <p className="stat-value">{candidates.length}</p>
              </div>
              <div className="stat-card">
                <h3>Your Status</h3>
                <p className="stat-value">{hasVoted ? "Voted" : "Not Voted"}</p>
              </div>
              {networkError && (
                <div className="stat-card error">
                  <h3>Network Error</h3>
                  <p className="stat-value">Please switch to the correct network.</p>
                  <button className="switch-network-button" onClick={switchNetwork}>
                    Switch Network
                  </button>
                </div>
              )}
            </section>

            <div className="main-content">
              <section className="candidates-section">
                <h2>Candidates</h2>
                
                {connectionError && (
                  <div className="error-message-box">
                    <div className="error-icon">⚠️</div>
                    <h3>Connection Issue</h3>
                    <p>{connectionError}</p>
                    <div className="action-buttons">
                      <button className="action-button" onClick={() => window.location.reload()}>
                        Reload Page
                      </button>
                    </div>
                  </div>
                )}
                
                {candidates.length === 0 ? (
                  <div className="no-candidates-message">
                    <p>No candidates found because:</p>
                    <ul>
                      <li>The voting contract is not properly deployed</li>
                      <li>You're connected to the wrong network</li>
                      <li>The contract hasn't been initialized with candidates</li>
                    </ul>
                    <div className="action-buttons">
                      <button className="action-button secondary" onClick={() => window.location.reload()}>
                        Refresh Page
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="candidates-grid">
                    {candidates.map((candidate) => (
                      <div 
                        key={candidate.id}
                        className={`candidate-card ${selectedCandidate?.id === candidate.id ? 'selected' : ''}`}
                        onClick={() => handleCandidateSelect(candidate)}
                      >
                        <div className="candidate-avatar">{candidate.name.charAt(0)}</div>
                        <h3>{candidate.name}</h3>
                        <div className="vote-count">{candidate.votes} votes</div>
                        <div className="vote-percentage">
                          {totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0}%
                        </div>
                        {hasVoted && (
                          <div className="vote-status-indicator">
                            {candidate.id === selectedCandidate?.id ? "Your Vote" : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedCandidate && !hasVoted && (
                  <div className="vote-confirmation">
                    <p>You are about to vote for <strong>{selectedCandidate.name}</strong></p>
                    <div className="action-buttons">
                      <button 
                        className="cancel-button"
                        onClick={() => setSelectedCandidate(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="confirm-button"
                        disabled={transactionPending}
                        onClick={confirmVote}
                      >
                        {transactionPending ? "Processing..." : "Confirm Vote"}
                      </button>
                    </div>
                  </div>
                )}
                
                {hasVoted && (
                  <div className="already-voted">
                    <p>You have already cast your vote. Thank you for participating!</p>
                    <p className="small-note">Switch to another account in MetaMask if you want to vote again.</p>
                  </div>
                )}
                
                {votingStatus && (
                  <div className="status-message">
                    {votingStatus}
                  </div>
                )}
                
                {showErrorModal && (
                  <div className="error-modal-overlay">
                    <div className="error-modal">
                      <div className="error-modal-header">
                        <h3>Transaction Error</h3>
                        <button className="close-modal" onClick={closeErrorModal}>×</button>
                      </div>
                      <div className="error-modal-body">
                        <div className="error-icon">❌</div>
                        <p>{errorMessage}</p>
                      </div>
                      <div className="error-modal-footer">
                        <button className="modal-button" onClick={closeErrorModal}>Close</button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="results-section">
                <h2>Live Results</h2>
                <div className="chart-container">
                  <Doughnut 
                    data={chartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: {
                              size: 11
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const percentage = totalVotes > 0 
                                ? ((value / totalVotes) * 100).toFixed(1) + '%'
                                : '0%';
                              return `${label}: ${value} votes (${percentage})`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </section>
            </div>
            
            {/* <section className="account-info-section">
              <h2>Account Management</h2>
              <p>Each MetaMask account can vote only once. To vote again, switch to a different account in your MetaMask wallet.</p>
              
              <div className="account-instructions">
                <h3>How to use multiple accounts:</h3>
                <ol>
                  <li>Open your MetaMask extension</li>
                  <li>Click on your account icon in the top-right corner</li>
                  <li>Select "Create Account" or "Import Account"</li>
                  <li>Switch between accounts to cast additional votes</li>
                </ol>
              </div>
              
              <div className="current-account">
                <h3>Current Account:</h3>
                <p className={`account-address ${hasVoted ? 'voted' : 'not-voted'}`}>
                  {account ? formatAddress(account) : "Not connected"} 
                  <span className="account-status">
                    {hasVoted ? "• Already Voted" : "• Not Voted Yet"}
                  </span>
                </p>
              </div>
            </section> */}
          </>
        )}
      </main>
      
      <footer className="app-footer">
        <p>Built with ❤️ on Ethereum blockchain • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
