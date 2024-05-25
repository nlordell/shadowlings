import { ethers } from "ethers"
import { recoverShadowlingAddress } from "./ShadowList"
import { calculateCommit } from "../utils/proof"

test("Recover expected address", () => {
    expect(
        recoverShadowlingAddress(ethers.id("commit"), "0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f", 31337)
    ).toBe("0xec31Bf31FaA8688FD52a85bbc2f7f4c69A876001")
})

test("Calculate commit", async () => {
    const owner = "0x1111111111111111111111111111111111111111";
    const entropy = "0x5afe";
    const salt = "0x01020304";
    const commit = await calculateCommit(owner, entropy, salt)
    expect(commit).toBe("0x153c333c4856f04f11c983484a8fbcd2705b4460498f55b4771cd09af3c306ab")
})