import { ethers } from "ethers"
import { hash, recoverShadowlingAddress } from "./ShadowList"

test("Recover expected address", () => {
    expect(
        recoverShadowlingAddress(ethers.id("commit"), "0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f", 31337)
    ).toBe("0xec31Bf31FaA8688FD52a85bbc2f7f4c69A876001")
})

test("Hash single", () => {
    const entropy = ethers.id("commit")
    expect(hash(entropy)).toBe(ethers.sha256(entropy))
})

test("Hash multi", () => {
    const entropy = ethers.id("commit")
    const exected = ethers.solidityPackedSha256(
        ["bytes32", "bytes32"],
        [ethers.ZeroHash, entropy]
    )
    expect(hash(ethers.ZeroHash, entropy)).toBe(exected)
})