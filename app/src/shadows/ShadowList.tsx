import Card from '@mui/material/Card';
import { Button, CardActions, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { SignatureLike, ethers } from 'ethers';
import BalanceView from '../status/BalanceView';
import { calculateCommit } from '../utils/proof';

const FIXED_SIGNATURE: SignatureLike = {
    yParity: 1,
    r: "0x74a52317b658076e35432533edc88c2f86823e2fcfd2b56f8fad46fb32d6a517",
    s: "0x18811e130eeacc4232614ef16382b62d0d6e04eadf9fb575647e9cca12f0147f"
}
const SHADOWLING_INVOKER = ethers.ZeroAddress
const CHAIN_ID = 31337

interface Shadow {
    address: string,
    salt: string
}

export interface Props {
    owner: string,
    entropy: string
}

const persistShadows = (owner: string, shadows: Array<Shadow>) => {
    localStorage.setItem(`${owner}_shadows`, JSON.stringify(shadows))
}

const loadPersistedShadows = (owner: string): Array<Shadow> => {
    return JSON.parse(localStorage.getItem(`${owner}_shadows`) || "[]")
}

export const recoverShadowlingAddress = (commit: string, invoker: string = SHADOWLING_INVOKER, chainid: number = CHAIN_ID): string => {
    const authHash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256", "uint256", "uint256", "bytes32"],
        ["0x04", chainid, 0, invoker, commit]
    )
    return ethers.recoverAddress(
        authHash, FIXED_SIGNATURE
    )
}

// keccak256(abi.encodePacked(uint8(0x04), block.chainid, uint256(0), uint256(uint160(address(this))), commit));
const createShadow = async (owner: string, entropy: string): Promise<Shadow> => {
    const salt = ethers.hexlify(ethers.randomBytes(31))
    const {commit} = await calculateCommit(owner, entropy, salt)
    const address = recoverShadowlingAddress(commit)
    return {
        address,
        salt
    }
}

export default function ShadowList({ owner, entropy }: Props): JSX.Element {
    const [shadows, setShadows] = useState<Array<Shadow>>(loadPersistedShadows(owner))

    const addShadow = useCallback(async() => {
        const shadows = loadPersistedShadows(owner)
        shadows.push(await createShadow(owner, entropy))
        persistShadows(owner, shadows)
        setShadows(shadows)
    }, [owner, entropy])

    const removeShadow = useCallback(async(shadowId: string) => {
        const shadows = loadPersistedShadows(owner)
            .filter((shadow) => shadow.address != shadowId)
        persistShadows(owner, shadows)
        setShadows(shadows)
    }, [owner, entropy])
    return (<Paper style={{padding: "8px", maxWidth: "800px", margin: "0px auto"}} elevation={0}>
        <Typography>Shadows: <Button onClick={addShadow}>Add</Button></Typography>
        {shadows.map((shadow) => (<Card style={{ margin: "8px" }}>
            <Typography>Address: {shadow.address}</Typography>
            <Typography>Salt: {shadow.salt}</Typography>
            <BalanceView address={shadow.address} salt={shadow.salt} />
            <CardActions>
                <Button size="small" onClick={() => removeShadow(shadow.address)}>Remove</Button>
            </CardActions>
        </Card>))}
    </Paper>)
}