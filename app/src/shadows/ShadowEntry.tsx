import Card from '@mui/material/Card';
import { Button, CardActions, Paper, Typography } from '@mui/material';
import BalanceView from '../status/BalanceView';
import { Shadow } from './ShadowList';
import { useEffect, useState } from 'react';
import RegisterDialog from '../transact/RegisterDialog';
import { queryRecoveryRegistrations } from '../utils/web3';

export interface Props {
    owner: string,
    shadow: Shadow,
    onRemove: (shadowAddress: string) => void
}

export default function ShadowEntry({ shadow, onRemove }: Props): JSX.Element {
    const [saltHash, setSaltHash] = useState<string | undefined>("")
    const [showRegisterDialog, setShowRegisterDialog] = useState(false)


    useEffect(() => {
        const check = async (shadowAddress: string) => {
            const registeredSaltHash = await queryRecoveryRegistrations(shadowAddress)
            setSaltHash(registeredSaltHash)
        }
        check(shadow.address)
    }, [shadow, setSaltHash])

    return (<Card style={{ margin: "8px" }}>
        <Typography>Address: {shadow.address}</Typography>
        <Typography>Salt: {shadow.salt}</Typography>
        <BalanceView address={shadow.address} salt={shadow.salt} />
        <CardActions>
            <Button size="small" onClick={() => onRemove(shadow.address)}>Remove</Button>
            {!saltHash && (<Button size="small" onClick={() => setShowRegisterDialog(true)}>Register Recovery</Button>)}
        </CardActions>

        <RegisterDialog 
            open={showRegisterDialog} 
            shadowAddress={shadow.address}
            salt={shadow.salt}
            handleClose={() => { setShowRegisterDialog(false) }}
            />
    </Card>)
}