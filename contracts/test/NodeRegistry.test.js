const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NodeRegistry", function () {
  let registry;
  let owner, nodeA, nodeB;
  const minimumStake = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, nodeA, nodeB] = await ethers.getSigners();
    const NodeRegistry = await ethers.getContractFactory("NodeRegistry");
    registry = await NodeRegistry.deploy(minimumStake);
  });

  it("should register a node successfully", async function () {
    await registry.connect(nodeA).register({ value: minimumStake });
    const node = await registry.nodes(nodeA.address);
    expect(node.isActive).to.be.true;
    expect(node.stakeAmount).to.equal(minimumStake);
  });

  it("should revert if stake is below minimum", async function () {
    const lowStake = ethers.parseEther("0.001");
    await expect(
      registry.connect(nodeA).register({ value: lowStake })
    ).to.be.revertedWith("Insufficient stake");
  });

  it("should revert if already registered", async function () {
    await registry.connect(nodeA).register({ value: minimumStake });
    await expect(
      registry.connect(nodeA).register({ value: minimumStake })
    ).to.be.revertedWith("Already registered");
  });

  it("should return active nodes correctly", async function () {
    await registry.connect(nodeA).register({ value: minimumStake });
    await registry.connect(nodeB).register({ value: minimumStake });
    const activeNodes = await registry.getActiveNodes();
    expect(activeNodes.length).to.equal(2);
    expect(activeNodes).to.include(nodeA.address);
    expect(activeNodes).to.include(nodeB.address);
  });

  it("should deactivate a node", async function () {
    await registry.connect(nodeA).register({ value: minimumStake });
    await registry.deactivateNode(nodeA.address);
    const node = await registry.nodes(nodeA.address);
    expect(node.isActive).to.be.false;
    expect(await registry.getNodeCount()).to.equal(0);
  });

  it("should emit NodeRegistered event", async function () {
    await expect(registry.connect(nodeA).register({ value: minimumStake }))
      .to.emit(registry, "NodeRegistered")
      .withArgs(nodeA.address, minimumStake);
  });

  it("should emit NodeRemoved event", async function () {
    await registry.connect(nodeA).register({ value: minimumStake });
    await expect(registry.deactivateNode(nodeA.address))
      .to.emit(registry, "NodeRemoved")
      .withArgs(nodeA.address);
  });
});
