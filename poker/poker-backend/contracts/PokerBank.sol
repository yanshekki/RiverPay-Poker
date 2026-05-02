// contracts/PokerBank.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokerBank is Ownable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    IERC20 public usdtToken;
    address public backendSigner;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount, uint256 nonce);

    constructor(address _usdtToken, address _backendSigner) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
        backendSigner = _backendSigner;
    }

    function setBackendSigner(address _newSigner) external onlyOwner {
        backendSigner = _newSigner;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        usdtToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    function claim(uint256 amount, uint256 nonce, bytes calldata signature) external {
        require(amount > 0, "Amount must be greater than 0");
        require(!usedNonces[msg.sender][nonce], "Nonce already used");

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

    function withdrawPlatformFees(uint256 amount) external onlyOwner {
        usdtToken.safeTransfer(owner(), amount);
    }
}