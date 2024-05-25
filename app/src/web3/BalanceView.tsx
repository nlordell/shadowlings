import { Typography } from "@mui/material"
import { ethers } from "ethers"
import { useCallback, useEffect, useState } from "react"

const RPC_URL = "http://devnet.otim.xyz"
const CORS_URL = 'https://corsproxy.io/?' + encodeURIComponent(RPC_URL);

var provider: ethers.Provider | undefined

export const globalProvier = (): ethers.Provider => {
    if (!provider)    
        provider = new ethers.JsonRpcProvider(CORS_URL)
    return provider
}

export interface Props {
    address: string,
    token?: string
}

const loadBalances = async(address: string, token: string | undefined): Promise<bigint> => {
    if (!token)
         return globalProvier().getBalance(address)
    else
        throw Error("Not implemented")
}

export default function BalanceView({ address, token }: Props): JSX.Element {

    const [balance, setBalance] = useState<string|undefined>()

    const refreshBalances = useCallback(async (address: string, token: string | undefined) => {
        try {
            const balance = await loadBalances(address, token)
            setBalance(ethers.formatEther(balance))
        } catch (e) {
            console.error(e)
        }
    }, [setBalance])

    useEffect(() => {
        // TODO: don't query new task if previous one was not finished
        refreshBalances(address, token)
        const currentTask = setInterval(() => refreshBalances(address, token), 10000)
        return () => clearInterval(currentTask);
    }, [address, token])
    return (<Typography>
        {token || "Ether"}: {balance || "Loading..."}
    </ Typography>)
}