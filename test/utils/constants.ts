import { ethers } from "ethers";

const msig = {
  DOMAIN_SEPARATOR_TYPEHASH: "0x0a684fcd4736a0673611bfe1e61ceb93fb09bcd288bc72c1155ebe13280ffeca",
  EXECUTE_TYPEHASH: "0xb4f360c8f1871041e03766587e5a864a0ff1c6996710c3b20746a744cee8a609",
}

export default { ...ethers.constants, msig }
