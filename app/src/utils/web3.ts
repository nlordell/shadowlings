import { ethers } from "ethers"

const RPC_URL = "http://devnet.otim.xyz"
const CORS_URL = 'https://corsproxy.io/?' + encodeURIComponent(RPC_URL);

var provider: ethers.Provider | undefined

export const globalProvier = (): ethers.Provider => {
    if (!provider)    
        provider = new ethers.JsonRpcProvider(CORS_URL)
    return provider
}