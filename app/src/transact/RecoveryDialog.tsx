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
        if (!saltHash) return
        try {
            const owner = ethers.getAddress(localStorage.getItem("owner")!!)
            const entropy = localStorage.getItem("entropy")!!
            // TODO: chech that entropy is set
            const registerData = await createRecoveryData(
                owner, entropy, saltHash
            )

            console.log(registerData)
            console.log(SHADOWLING_ADDRESS)
            // 0x96a427c9149ca38214155fd1ed8178328c6924db0d7ad7b3ef3241f48dc61ffba0077ba72a5ab316a138ac5332460fca41be905825b92d256de7311d7ce1165493d8c1fb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000003fbb1742c5364239164b8bef4c386f38ceba80d300000000000000000000000000000000000000000000000000038d7ea4c680002aa22dee77c54abd4f3b9789701e1bbce4f4f065e3857ac83829578fd5c21ddb2879b8ac8a529f59c31a50978855242cfb5a70097feda7d0fe3a45ae94914c222df50956f24772814038779bd1974b6d4d160d92cb7c831384e58b01cce74a7f15d9ca3c931c6cf920c3d6d4fdf30070d30bcc2fce45019fc089ba34cd56fc1c1849231a53593f6c9758b09c889b4b6828f8ab32bbeeff386010f356416c2c2b196c061d8f926691eae420c97a779822db85c8a131d7641cb6081b07bf21bfed00fe5b2b408c06edc76f7cedeceb20f57d1099616d37abbcadb1d7867ce148221bde399a6846473c7a961e13d0a27918c830f631cd8b15c2e3665a93045023a7
            console.log(encodeRecovery(registerData.commit, saltHash, ethers.ZeroAddress, owner, ethers.parseEther("0.001"), registerData.proof))
            handleClose()
        } catch (e) {
            console.error(e)
        }
    }, [saltHash, handleClose])

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
                <DialogActions>
                    <Button size="small" onClick={() => buildRecoverData()}>Recover</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}