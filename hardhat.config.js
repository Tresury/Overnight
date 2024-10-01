require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: "https://mainnet.infura.io/v3/xxxxxxxxxxxxxxxxxxxx", // ввести свою ссылку infura
        blockNumber: 20854002
      }
    }
  }
};


