const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔥 準備部署企業級 Factory 系統到區塊鏈...");

  // 取得部署者的錢包帳號 (對應你 .env 裡面的 PRIVATE_KEY)
  const [deployer] = await hre.ethers.getSigners();
  console.log(`💼 執行部署的錢包地址 (管理員): ${deployer.address}`);

  // 取得錢包目前的 AVAX 餘額 (主網部署需要真的 AVAX 當 Gas)
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 錢包 AVAX 餘額: ${hre.ethers.formatEther(balance)} AVAX`);

  if (balance === 0n) {
    throw new Error("你的錢包裡沒有 AVAX！請先充值 AVAX 以支付 Gas Fee。");
  }

  // ==========================================
  // 核心參數設定 (Avalanche 主網真實數據)
  // ==========================================
  
  // Avalanche C-Chain 官方原生 USDT 地址
  const AVAX_MAINNET_USDT = "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"; 
  
  // 授權簽名提款的 Backend 伺服器錢包 (這裡預設用你的部署錢包)
  const BACKEND_SIGNER = deployer.address; 
  
  // 接收每局 10% 佣金抽水的主錢包 (Main Wallet)
  const PLATFORM_WALLET = deployer.address; 

  console.log("\n⏳ [1/3] 正在部署 PokerRoom (邏輯大腦 Implementation)...");
  const PokerRoom = await hre.ethers.getContractFactory("PokerRoom");
  // 邏輯大腦不需要 constructor 參數
  const roomImpl = await PokerRoom.deploy(); 
  await roomImpl.waitForDeployment();
  const implAddress = await roomImpl.getAddress();
  console.log(`✅ PokerRoom 大腦已部署至: ${implAddress}`);

  console.log("\n⏳ [2/3] 正在部署 PokerFactory (工廠合約)...");
  const PokerFactory = await hre.ethers.getContractFactory("PokerFactory");
  const factory = await PokerFactory.deploy(AVAX_MAINNET_USDT, BACKEND_SIGNER, PLATFORM_WALLET);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(
    `✅ PokerFactory 工廠已部署至: ${factoryAddress}\n` +
    `   └> 設定的 USDT: ${AVAX_MAINNET_USDT}\n` +
    `   └> 授權提款簽名者: ${BACKEND_SIGNER}\n` +
    `   └> 10% 佣金接收錢包: ${PLATFORM_WALLET}`
  );

  console.log("\n⏳ [3/3] 正在將大腦綁定到工廠中...");
  // 必須等交易上鏈確認
  const tx = await factory.setImplementation(implAddress);
  await tx.wait(); 
  console.log("✅ 綁定完成！這套企業級系統現在準備好接客了！");

  // ==========================================
  // 匯出 ABI 與合約地址給前端與後端使用
  // ==========================================
  const contractData = {
    network: hre.network.name,
    factoryAddress: factoryAddress,
    factoryAbi: JSON.parse(factory.interface.formatJson()),
    roomAbi: JSON.parse(roomImpl.interface.formatJson()) 
  };

  const outputPath = path.join(__dirname, '../ContractData.json');
  fs.writeFileSync(outputPath, JSON.stringify(contractData, null, 2));
  
  console.log(`\n💾 前後端對接所需的合約數據已成功儲存至: ${outputPath}`);
}

main().catch((error) => {
  console.error("❌ 部署失敗:", error);
  process.exitCode = 1;
});