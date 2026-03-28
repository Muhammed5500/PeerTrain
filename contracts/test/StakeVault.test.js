const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeVault", function () {
  let vault;
  let owner, scoringEngine, nodeA, nodeB;
  const stakeAmount = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, scoringEngine, nodeA, nodeB] = await ethers.getSigners();
    const StakeVault = await ethers.getContractFactory("StakeVault");
    vault = await StakeVault.deploy(scoringEngine.address);
  });

  it("should stake correctly", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    expect(await vault.getStake(nodeA.address)).to.equal(stakeAmount);
  });

  it("should emit Staked event", async function () {
    await expect(vault.connect(nodeA).stake({ value: stakeAmount }))
      .to.emit(vault, "Staked")
      .withArgs(nodeA.address, stakeAmount);
  });

  it("should slash only from scoringEngine", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    const slashAmount = ethers.parseEther("0.05");
    await vault.connect(scoringEngine).slash(nodeA.address, slashAmount);
    expect(await vault.getStake(nodeA.address)).to.equal(
      stakeAmount - slashAmount
    );
  });

  it("should revert slash from unauthorized caller", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    const slashAmount = ethers.parseEther("0.05");
    await expect(
      vault.connect(nodeA).slash(nodeA.address, slashAmount)
    ).to.be.revertedWith("Only scoring engine");
  });

  it("should revert slash with insufficient stake", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    const bigSlash = ethers.parseEther("2.0");
    await expect(
      vault.connect(scoringEngine).slash(nodeA.address, bigSlash)
    ).to.be.revertedWith("Insufficient stake");
  });

  it("should reward correctly", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    const rewardAmount = ethers.parseEther("0.02");
    // Fund the vault so it can pay rewards
    await owner.sendTransaction({ to: await vault.getAddress(), value: ethers.parseEther("10") });
    await vault.connect(scoringEngine).reward(nodeA.address, rewardAmount);
    expect(await vault.getStake(nodeA.address)).to.equal(
      stakeAmount + rewardAmount
    );
  });

  it("should withdraw correctly", async function () {
    await vault.connect(nodeA).stake({ value: stakeAmount });
    const balanceBefore = await ethers.provider.getBalance(nodeA.address);
    const tx = await vault.connect(nodeA).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const balanceAfter = await ethers.provider.getBalance(nodeA.address);
    expect(balanceAfter).to.equal(balanceBefore + stakeAmount - gasUsed);
    expect(await vault.getStake(nodeA.address)).to.equal(0);
  });
});
