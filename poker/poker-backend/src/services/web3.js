const { ethers } = require('ethers');
const ContractData = require('../../ContractData.json');
require('dotenv').config();

const AVALANCHE_RPC = process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc';

// ==========================================
// 1. 產生提款簽名 (後端用私鑰擔保)
// ==========================================
// 🌟 參數改為 userAddress 和 exactAmount (精準金額)
async function generateClaimSignature(userAddress, exactAmount, contractAddress) {
    // 玩家要退出的精準籌碼 (已經是在遊戲中扣除過抽水的淨額)
    const amountUnits = ethers.parseUnits(exactAmount.toString(), 6);
    
    const nonce = Math.floor(Math.random() * 1000000000);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    
    const payload = ethers.solidityPacked(
        ["address", "uint256", "uint256", "address"],
        [userAddress, amountUnits, nonce, contractAddress]
    );
    const messageHash = ethers.keccak256(payload);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log(`🔐 已為玩家 ${userAddress} 產生提款簽名，可提領 ${exactAmount} USDT`);

    // 回傳精準的金額與簽名
    return { amount: amountUnits.toString(), nonce, signature };
}

// ==========================================
// 2. 平台執行抽水 (將剩下的 10% 轉回主錢包)
// ==========================================
async function executeSweep(contractAddress) {
    try {
        const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const pokerContract = new ethers.Contract(contractAddress, ContractData.roomAbi, wallet);
        
        console.log(`🧹 開始執行抽水指令，目標合約: ${contractAddress}`);
        const tx = await pokerContract.sweep();
        await tx.wait();
        console.log(`✅ 抽水完美成功！10% 佣金已入帳！Transaction: ${tx.hash}`);
    } catch (error) {
        console.error("❌ 抽水失敗:", error);
    }
}

// ==========================================
// 🌟 3. 新增：驗證玩家入金交易 (防駭客作弊)
// ==========================================
async function verifyDepositTransaction(txHash, contractAddress, expectedUser, expectedAmount) {
    try {
        // 連線到 Avalanche 主網節點查帳
        const provider = new ethers.JsonRpcProvider(AVALANCHE_RPC);
        
        // 取得交易收據 (Receipt)
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt || receipt.status === 0) {
            console.log("❌ 驗證失敗: 交易失敗或不存在");
            return false;
        }

        // 確認交易目標是我們這局的合約
        if (receipt.to.toLowerCase() !== contractAddress.toLowerCase()) {
            console.log("❌ 驗證失敗: 交易目標合約不符");
            return false;
        }

        const pokerContract = new ethers.Contract(contractAddress, ContractData.roomAbi, provider);
        const expectedAmountUnits = ethers.parseUnits(expectedAmount.toString(), 6);

        // 解析交易 Log，找出 Deposit 事件
        let depositFound = false;
        for (const log of receipt.logs) {
            try {
                const parsedLog = pokerContract.interface.parseLog(log);
                if (parsedLog.name === 'Deposit') {
                    const user = parsedLog.args[0];
                    const amount = parsedLog.args[1];

                    // 核對付款人地址與金額是否與前端聲稱的一致
                    if (user.toLowerCase() === expectedUser.toLowerCase() && amount.toString() === expectedAmountUnits.toString()) {
                        depositFound = true;
                        break;
                    }
                }
            } catch (e) {
                // 略過無法解析的 Log
            }
        }
        return depositFound;
    } catch (error) {
        console.error("驗證入金交易發生錯誤:", error);
        return false;
    }
}

module.exports = { generateClaimSignature, executeSweep, verifyDepositTransaction };