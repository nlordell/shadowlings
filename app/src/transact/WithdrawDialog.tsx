import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { Button, CardActionArea, DialogActions } from '@mui/material';
import { encodeBase32 } from 'geohashing';
import React, { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { createWithdrawData } from '../utils/proof';

interface OwnerResult {
    owner: string
}

export interface Props {
    open: boolean,
    handleSubmit: () => void,
    shadowAddress: string,
    salt: string,
    token: string | undefined,
    maxAmount: string | undefined
}

export default function WithdrawDialog({ open, handleSubmit, shadowAddress, salt, token }: Props): JSX.Element {
    const [target, setTarget] = React.useState("")
    const [amount, setAmount] = React.useState("")


    const generateProof = useCallback(async(target: string, amount: string) => {
        try {
            const owner = ethers.getAddress(localStorage.getItem("owner")!!)
            const entropy = localStorage.getItem("entropy")!!
            // TODO: chech that entropy is set
            const targetAddress = ethers.getAddress(target)
            const amountAtoms = ethers.parseEther(amount)
            const withdrawData = await createWithdrawData(
                owner, entropy, salt, token || ethers.ZeroAddress, targetAddress, amountAtoms
            )
            console.log(withdrawData)
            //setTarget("")
            //setAmount("")
            handleSubmit()
        } catch (e) {
            console.error(e)
        }
    }, [shadowAddress, salt, token, handleSubmit, setTarget, setAmount])

    return (
        <Dialog 
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Withdraw Assets"}
            </DialogTitle>
            <DialogContent style={{ padding: "8px" }}>
                <TextField 
                    label="Target Address"
                    variant="standard"
                    value={target}
                    onChange={ (e) => setTarget(e.target.value)}
                    style={{ margin: "8px" }}
                    />
                <TextField 
                    label="Amount"
                    variant="standard"
                    value={amount}
                    onChange={ (e) => setAmount(e.target.value)}
                    style={{ margin: "8px" }}
                    />
                <DialogActions>
                    <Button size="small" onClick={() => generateProof(target, amount)}>Submit</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}