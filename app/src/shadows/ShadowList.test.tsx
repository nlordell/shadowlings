import { ethers } from "ethers"
import { recoverShadowlingAddress } from "./ShadowList"

test("Recover expected address", () => {
    expect(
        recoverShadowlingAddress(ethers.id("commit"), "0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f", 31337)
    ).toBe("0xec31Bf31FaA8688FD52a85bbc2f7f4c69A876001")
})