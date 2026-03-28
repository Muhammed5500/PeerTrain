require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    "monad-testnet": {
      url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY_COORDINATOR
        ? [
            process.env.PRIVATE_KEY_COORDINATOR,
            process.env.PRIVATE_KEY_NODE_A,
            process.env.PRIVATE_KEY_NODE_B,
            process.env.PRIVATE_KEY_NODE_C,
            process.env.PRIVATE_KEY_NODE_D,
          ].filter(Boolean)
        : [],
    },
  },
};
