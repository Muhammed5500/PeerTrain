// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract NodeRegistry {
    struct Node {
        address owner;
        uint256 stakeAmount;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Node) public nodes;
    address[] public activeNodes;
    uint256 public minimumStake;
    address public scoringEngine;
    address public owner;

    event NodeRegistered(address indexed node, uint256 stake);
    event NodeRemoved(address indexed node);

    modifier onlyOwnerOrScoringEngine() {
        require(
            msg.sender == owner || msg.sender == scoringEngine,
            "Not authorized"
        );
        _;
    }

    constructor(uint256 _minimumStake) {
        minimumStake = _minimumStake;
        owner = msg.sender;
    }

    function setScoringEngine(address _scoringEngine) external {
        require(msg.sender == owner, "Only owner");
        scoringEngine = _scoringEngine;
    }

    function register() external payable {
        require(msg.value >= minimumStake, "Insufficient stake");
        require(!nodes[msg.sender].isActive, "Already registered");

        nodes[msg.sender] = Node({
            owner: msg.sender,
            stakeAmount: msg.value,
            isActive: true,
            registeredAt: block.timestamp
        });

        activeNodes.push(msg.sender);
        emit NodeRegistered(msg.sender, msg.value);
    }

    function deactivateNode(
        address node
    ) external onlyOwnerOrScoringEngine {
        require(nodes[node].isActive, "Node not active");
        nodes[node].isActive = false;

        // Remove from activeNodes array
        for (uint256 i = 0; i < activeNodes.length; i++) {
            if (activeNodes[i] == node) {
                activeNodes[i] = activeNodes[activeNodes.length - 1];
                activeNodes.pop();
                break;
            }
        }

        emit NodeRemoved(node);
    }

    function getActiveNodes() external view returns (address[] memory) {
        return activeNodes;
    }

    function getNodeCount() external view returns (uint256) {
        return activeNodes.length;
    }

    function isNodeActive(address node) external view returns (bool) {
        return nodes[node].isActive;
    }
}
