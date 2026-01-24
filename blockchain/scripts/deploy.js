const hre = require("hardhat");

async function main() {
  console.log("🏥 Deploying MedChain Smart Contract...");
  
  // Get the contract factory
  const MedChain = await hre.ethers.getContractFactory("MedChain");
  
  // Deploy the contract
  console.log("📝 Deploying contract to network...");
  const medChain = await MedChain.deploy();
  
  await medChain.waitForDeployment();
  
  const contractAddress = await medChain.getAddress();
  
  console.log("\n✅ MedChain deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("\n🔗 Network:", hre.network.name);
  
  if (hre.network.name === "sepolia") {
    console.log("\n🌐 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }
  
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update frontend/src/config.js with this address");
  console.log("3. Run: cd frontend && npm run dev");
  console.log("\n🎉 Ready to build the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
