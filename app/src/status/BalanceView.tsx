import { Button, Typography } from "@mui/material"
import { ethers } from "ethers"
import { useCallback, useEffect, useState } from "react"
import { globalProvier } from "../utils/web3"
import WithdrawDialog from "../transact/WithdrawDialog"

export interface Props {
    address: string,
    salt: string,
    token?: string
}

const loadBalances = async(address: string, token: string | undefined): Promise<bigint> => {
    if (!token)
         return globalProvier().getBalance(address)
    else
        throw Error("Not implemented")
}

export default function BalanceView({ address, salt, token }: Props): JSX.Element {

    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
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
        <Button size="small" onClick={() => setShowWithdrawDialog(true)}>Withdraw</Button>

        <WithdrawDialog 
            open={showWithdrawDialog} 
            shadowAddress={address}
            salt={salt}
            token={token}
            maxAmount={balance}
            handleSubmit={() => { setShowWithdrawDialog(false) }}
        />
    </ Typography>)
}