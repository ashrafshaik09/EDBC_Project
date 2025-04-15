const hre = require("hardhat");

async function main() {
  // Define candidates
  const candidates = ["Alice", "Bob", "Charlie"," David", "Eve"];

  // Get the contract factory
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // Deploy the contract with candidates as constructor arguments
  const voting = await Voting.deploy(candidates);
  
  // Wait for deployment to finish
  await voting.waitForDeployment();
  
  // Get the contract address
  const address = await voting.getAddress();
  
  console.log("Voting contract deployed to:", address);
  
  // Save the contract address to use it in the frontend
  console.log("Please copy this address into your React frontend configuration.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
