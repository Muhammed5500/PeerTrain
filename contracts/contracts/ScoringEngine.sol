// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StakeVault.sol";
import "./NodeRegistry.sol";

contract ScoringEngine {
    StakeVault public vault;
    NodeRegistry public registry;

    uint256 public currentRound;
    int256 public threshold = 200; // 0.200 * 1000 (fixed point)
    uint256 public slashRate = 5;  // slash rate (%)
    uint256 public rewardRate = 2; // reward rate (%)
    address public coordinator;

    mapping(uint256 => mapping(address => int256)) public roundScores;

    event RoundSettled(uint256 indexed roundId, uint256 nodeCount);
    event NodeSlashed(uint256 indexed roundId, address indexed node, int256 score);
    event NodeRewarded(uint256 indexed roundId, address indexed node, int256 score);

    modifier onlyCoordinator() {
        require(msg.sender == coordinator, "Only coordinator");
        _;
    }

    constructor(address _vault, address _registry, address _coordinator) {
        vault = StakeVault(payable(_vault));
        registry = NodeRegistry(_registry);
        coordinator = _coordinator;
    }

    function submitRoundScores(
        address[] calldata nodes,
        int256[] calldata scores
    ) external onlyCoordinator {
        require(nodes.length == scores.length, "Length mismatch");

        currentRound++;

        for (uint256 i = 0; i < nodes.length; i++) {
            address node = nodes[i];
            int256 score = scores[i];

            roundScores[currentRound][node] = score;

            uint256 stakeAmount = vault.getStake(node);

            if (score < threshold) {
                uint256 slashAmount = (stakeAmount * slashRate) / 100;
                if (slashAmount > 0) {
                    vault.slash(node, slashAmount);
                }
                emit NodeSlashed(currentRound, node, score);
            } else {
                uint256 rewardAmount = (stakeAmount * rewardRate) / 100;
                if (rewardAmount > 0) {
                    vault.reward(node, rewardAmount);
                }
                emit NodeRewarded(currentRound, node, score);
            }
        }

        emit RoundSettled(currentRound, nodes.length);
    }

    function getRoundScore(
        uint256 round,
        address node
    ) external view returns (int256) {
        return roundScores[round][node];
    }

    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }
}
