import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import { Button, DialogActions, Typography } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { createRecoveryData } from '../utils/proof';
import { queryRecoveryRegistrations } from '../utils/web3';
import { SHADOWLING_ADDRESS, encodeRecovery } from '../utils/invoker';


export interface Props {
    open: boolean,
    handleClose: () => void,
}

export default function RecoveryDialog({ open, handleClose }: Props): JSX.Element {
    const [shadowAddress, setShadowAddress] = React.useState("")
    const [recoverParams, setRecoverParams] = React.useState("")
    const [saltHash, setSaltHash] = React.useState<string | undefined>()
    useEffect(() => {
        setSaltHash(undefined)
        const loadSaltHash = async() => {
            try {
                const address = ethers.getAddress(shadowAddress)
                const saltHash = await queryRecoveryRegistrations(address)
                setSaltHash(saltHash)
            } catch (e) {
                console.error(e)
            }
        }
        loadSaltHash()
    }, [shadowAddress])
    const buildRecoverData = useCallback(async() => {
        setRecoverParams("")
        if (!saltHash) return
        try {
            const owner = ethers.getAddress(localStorage.getItem("owner")!!)
            const entropy = localStorage.getItem("entropy")!!
            // TODO: chech that entropy is set
            const registerData = await createRecoveryData(
                owner, entropy, saltHash
            )

            console.log(SHADOWLING_ADDRESS)

            const p: any = registerData.proof.proof;
            const params = JSON.stringify([
                registerData.commit, saltHash, ethers.ZeroAddress, owner, ethers.parseEther("0.001").toString(), [p.a, p.b, p.c]
            ], null, 2)
            console.log(params)
            setRecoverParams(params)
            console.log(encodeRecovery(registerData.commit, saltHash, ethers.ZeroAddress, owner, ethers.parseEther("0.001"), registerData.proof))
        } catch (e) {
            console.error(e)
        }
    }, [saltHash])

    return (
        <Dialog 
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Register Recovery"}
            </DialogTitle>
            <DialogContent style={{ padding: "8px" }}>
                <TextField 
                    label="Shadow Address"
                    variant="standard"
                    value={shadowAddress}
                    onChange={ (e) => setShadowAddress(e.target.value)}
                    style={{ margin: "8px" }}
                    />
                {saltHash && (<Typography>{saltHash}</Typography>)}
                {recoverParams && (<Typography>{recoverParams}</Typography>)}
                <DialogActions>
                    <Button size="small" onClick={() => buildRecoverData()}>Recover</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}