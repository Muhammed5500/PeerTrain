const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON");

  // 1. Deploy NodeRegistry (minimumStake: 0.01 MON)
  const minimumStake = ethers.parseEther("0.01");
  const NodeRegistry = await ethers.getContractFactory("NodeRegistry");
  const registry = await NodeRegistry.deploy(minimumStake);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("NodeRegistry deployed to:", registryAddress);

  // 2. Deploy StakeVault (scoringEngine set later)
  const StakeVault = await ethers.getContractFactory("StakeVault");
  const vault = await StakeVault.deploy(deployer.address); // temporary
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("StakeVault deployed to:", vaultAddress);

  // 3. Deploy ScoringEngine
  const ScoringEngine = await ethers.getContractFactory("ScoringEngine");
  const engine = await ScoringEngine.deploy(vaultAddress, registryAddress, deployer.address);
  await engine.waitForDeployment();
  const engineAddress = await engine.getAddress();
  console.log("ScoringEngine deployed to:", engineAddress);

  // 4. Set ScoringEngine on StakeVault
  const tx = await vault.setScoringEngine(engineAddress);
  await tx.wait();
  console.log("StakeVault scoringEngine set to:", engineAddress);

  // 5. Save addresses
  const addresses = {
    NodeRegistry: registryAddress,
    StakeVault: vaultAddress,
    ScoringEngine: engineAddress,
    deployer: deployer.address,
    network: "monad-testnet",
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
