// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

// ==========================================
// 1. 遊戲房間合約 (邏輯大腦 - Implementation)
// ==========================================
contract PokerRoom {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    bool private initialized; // 防止重複初始化
    IERC20 public usdtToken;
    address public backendSigner;
    address public platformWallet; // 接收 10% 抽水的總錢包
    string public roomId;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount, uint256 nonce);
    event Swept(uint256 amount);

    // 初始化函數 (取代傳統的 constructor，因為克隆合約不能用 constructor)
    function initialize(
        address _usdtToken,
        address _backendSigner,
        address _platformWallet,
        string memory _roomId
    ) external {
        require(!initialized, "Already initialized");
        initialized = true;
        
        usdtToken = IERC20(_usdtToken);
        backendSigner = _backendSigner;
        platformWallet = _platformWallet;
        roomId = _roomId;
    }

    // 玩家入金
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    // 贏家憑 Backend 簽名提款
    function claim(uint256 amount, uint256 nonce, bytes calldata signature) external {
        require(amount > 0, "Amount must be > 0");
        require(!usedNonces[msg.sender][nonce], "Nonce used");

        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, amount, nonce, address(this))
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        require(recoveredSigner == backendSigner, "Invalid signature");

        usedNonces[msg.sender][nonce] = true;
        usdtToken.safeTransfer(msg.sender, amount);
        emit Withdraw(msg.sender, amount, nonce);
    }

    // Backend 一鍵抽走合約剩餘的資金 (10% 佣金) 到 Main Wallet
    function sweep() external {
        require(msg.sender == backendSigner, "Only backend can sweep");
        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "No funds to sweep");
        
        usdtToken.safeTransfer(platformWallet, balance);
        emit Swept(balance);
    }
}

// ==========================================
// 2. 工廠合約 (負責批量生產克隆房間)
// ==========================================
contract PokerFactory is Ownable {
    address public roomImplementation; // 大腦合約的地址
    address public usdtToken;
    address public backendSigner;
    address public platformWallet;

    event RoomCreated(address indexed roomAddress, string roomId, address indexed creator);

    constructor(
        address _usdtToken,
        address _backendSigner,
        address _platformWallet
    ) Ownable(msg.sender) {
        usdtToken = _usdtToken;
        backendSigner = _backendSigner;
        platformWallet = _platformWallet;
    }

    // 設定大腦合約地址 (只有管理員能設)
    function setImplementation(address _impl) external onlyOwner {
        roomImplementation = _impl;
    }

    // 玩家呼叫這個函數來開局 (玩家付極少量的 Gas)
    function createRoom(string memory roomId) external returns (address) {
        require(roomImplementation != address(0), "Implementation not set");
        
        // 核心魔法：使用 OpenZeppelin 的 Clones 庫瞬間產出一個獨立合約
        address clone = Clones.clone(roomImplementation);
        
        // 喚醒這個新合約並寫入資料
        PokerRoom(clone).initialize(usdtToken, backendSigner, platformWallet, roomId);
        
        // 告訴 Backend 和前端，新合約誕生了！
        emit RoomCreated(clone, roomId, msg.sender);
        
        return clone;
    }
}