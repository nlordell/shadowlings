import { ethers } from "ethers"
import { globalProvier } from "./web3"

export interface Token {
    address: string
    decimals: number
    name: string
    symbol: string
}

export const KNOWN_TOKEN: Token[] = [{
    address: "0xDF12F1c4cc6fab61403bBBEC5A2BfA9638Ed2A05",
    decimals: 18,
    name: "Shadow Token",
    symbol: "SHD"
}]

const TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)"
]

const TOKEN = new ethers.Interface(TOKEN_ABI)

export const getToken = (address: string): ethers.Contract => {
    return new ethers.Contract(address, TOKEN, globalProvier())

}