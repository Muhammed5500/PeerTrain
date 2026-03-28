// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract StakeVault {
    mapping(address => uint256) public stakes;
    address public scoringEngine;
    address public owner;

    event Staked(address indexed node, uint256 amount);
    event Slashed(address indexed node, uint256 amount);
    event Rewarded(address indexed node, uint256 amount);

    modifier onlyScoringEngine() {
        require(msg.sender == scoringEngine, "Only scoring engine");
        _;
    }

    constructor(address _scoringEngine) {
        scoringEngine = _scoringEngine;
        owner = msg.sender;
    }

    function setScoringEngine(address _scoringEngine) external {
        require(msg.sender == owner, "Only owner");
        scoringEngine = _scoringEngine;
    }

    function stake() external payable {
        stakes[msg.sender] += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    function slash(address node, uint256 amount) external onlyScoringEngine {
        require(stakes[node] >= amount, "Insufficient stake");
        stakes[node] -= amount;
        emit Slashed(node, amount);
    }

    function reward(address node, uint256 amount) external onlyScoringEngine {
        stakes[node] += amount;
        emit Rewarded(node, amount);
    }

    function withdraw() external {
        uint256 amount = stakes[msg.sender];
        require(amount > 0, "No stake to withdraw");
        stakes[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getStake(address node) external view returns (uint256) {
        return stakes[node];
    }

    receive() external payable {}
}
