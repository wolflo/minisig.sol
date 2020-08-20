import { ethers } from "ethers";

const msig = {
  DOMSEP_TYPEHASH: "0x0a684fcd4736a0673611bfe1e61ceb93fb09bcd288bc72c1155ebe13280ffeca",
  /* EXEC_TYPEHASH: "0xb4f360c8f1871041e03766587e5a864a0ff1c6996710c3b20746a744cee8a609", */
  EXEC_TYPEHASH: "0x9c1370cbf5462da152553d1b9556f96a7eb4dfe28fbe07e763227834d409103a",
}

// --- revert strings ---
const revertStrings = {
}

const systemConstants = {
  msig,
  revertStrings
}

export default { ...ethers.constants, ...systemConstants }
