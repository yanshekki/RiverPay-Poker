require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.warn("⚠️ 警告: .env 檔案中沒有找到 PRIVATE_KEY！部署到主網將會失敗。");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun", // 🌟 魔法參數：告訴編譯器啟用最新的坎昆升級指令！
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    fuji: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      chainId: 43113,
      accounts: privateKey ? [privateKey] : []
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      chainId: 43114,
      accounts: privateKey ? [privateKey] : []
    }
  }
};