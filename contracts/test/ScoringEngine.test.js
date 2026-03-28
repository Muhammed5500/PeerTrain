const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ScoringEngine", function () {
  let vault, registry, engine;
  let owner, coordinator, nodeA, nodeB, nodeC;
  const minimumStake = ethers.parseEther("0.01");
  const stakeAmount = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, coordinator, nodeA, nodeB, nodeC] = await ethers.getSigners();

    // Deploy NodeRegistry
    const NodeRegistry = await ethers.getContractFactory("NodeRegistry");
    registry = await NodeRegistry.deploy(minimumStake);

    // Deploy StakeVault with temporary scoring engine (will update)
    const StakeVault = await ethers.getContractFactory("StakeVault");
    vault = await StakeVault.deploy(owner.address);

    // Deploy ScoringEngine
    const ScoringEngine = await ethers.getContractFactory("ScoringEngine");
    engine = await ScoringEngine.deploy(
      await vault.getAddress(),
      await registry.getAddress(),
      coordinator.address
    );

    // Set scoring engine on vault
    await vault.setScoringEngine(await engine.getAddress());

    // Register and stake nodes
    await registry.connect(nodeA).register({ value: minimumStake });
    await registry.connect(nodeB).register({ value: minimumStake });
    await registry.connect(nodeC).register({ value: minimumStake });

    await vault.connect(nodeA).stake({ value: stakeAmount });
    await vault.connect(nodeB).stake({ value: stakeAmount });
    await vault.connect(nodeC).stake({ value: stakeAmount });

    // Fund vault for rewards
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  it("should submit round scores successfully", async function () {
    const nodes = [nodeA.address, nodeB.address, nodeC.address];
    const scores = [600, 580, -210]; // fixed point * 1000

    await engine.connect(coordinator).submitRoundScores(nodes, scores);
    expect(await engine.getCurrentRound()).to.equal(1);
  });

  it("should slash node below threshold", async function () {
    const nodes = [nodeA.address, nodeB.address, nodeC.address];
    const scores = [600, 580, -210]; // nodeC below threshold (200)

    const stakeBefore = await vault.getStake(nodeC.address);
    await engine.connect(coordinator).submitRoundScores(nodes, scores);
    const stakeAfter = await vault.getStake(nodeC.address);

    // slashRate = 5%, so slash = 1.0 * 5 / 100 = 0.05 ETH
    const expectedSlash = stakeAmount * 5n / 100n;
    expect(stakeAfter).to.equal(stakeBefore - expectedSlash);
  });

  it("should reward node above threshold", async function () {
    const nodes = [nodeA.address, nodeB.address, nodeC.address];
    const scores = [600, 580, -210]; // nodeA above threshold

    const stakeBefore = await vault.getStake(nodeA.address);
    await engine.connect(coordinator).submitRoundScores(nodes, scores);
    const stakeAfter = await vault.getStake(nodeA.address);

    // rewardRate = 2%, so reward = 1.0 * 2 / 100 = 0.02 ETH
    const expectedReward = stakeAmount * 2n / 100n;
    expect(stakeAfter).to.equal(stakeBefore + expectedReward);
  });

  it("should increment round counter", async function () {
    const nodes = [nodeA.address];
    const scores = [600];

    await engine.connect(coordinator).submitRoundScores(nodes, scores);
    expect(await engine.getCurrentRound()).to.equal(1);

    await engine.connect(coordinator).submitRoundScores(nodes, scores);
    expect(await engine.getCurrentRound()).to.equal(2);
  });

  it("should revert from unauthorized caller", async function () {
    const nodes = [nodeA.address];
    const scores = [600];

    await expect(
      engine.connect(nodeA).submitRoundScores(nodes, scores)
    ).to.be.revertedWith("Only coordinator");
  });

  it("should emit RoundSettled event", async function () {
    const nodes = [nodeA.address, nodeB.address];
    const scores = [600, 580];

    await expect(
      engine.connect(coordinator).submitRoundScores(nodes, scores)
    )
      .to.emit(engine, "RoundSettled")
      .withArgs(1, 2);
  });

  it("should emit NodeSlashed event for cheater", async function () {
    const nodes = [nodeC.address];
    const scores = [-210];

    await expect(
      engine.connect(coordinator).submitRoundScores(nodes, scores)
    )
      .to.emit(engine, "NodeSlashed")
      .withArgs(1, nodeC.address, -210);
  });

  it("should emit NodeRewarded event for honest node", async function () {
    const nodes = [nodeA.address];
    const scores = [600];

    await expect(
      engine.connect(coordinator).submitRoundScores(nodes, scores)
    )
      .to.emit(engine, "NodeRewarded")
      .withArgs(1, nodeA.address, 600);
  });
});
