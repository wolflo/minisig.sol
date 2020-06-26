usePlugin("buidler-ethers-v5");

module.exports = {
  defaultNetwork: "buidlerevm",
  solc: {
    version: "0.6.6",
    optimizer: {
      enabled: false,
      runs: 200
    },
  },
};
