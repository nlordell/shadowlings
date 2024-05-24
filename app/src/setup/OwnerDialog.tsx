import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import { CardActionArea } from '@mui/material';
import { encodeBase32 } from 'geohashing';
import React, { useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

interface OwnerResult {
    owner: string
}

export interface Props {
    open: boolean,
    handleSelect: (entropy: string) => void
}

export default function OwnerDialog({ open, handleSelect }: Props): JSX.Element {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<Array<OwnerResult>>([])

    const fetchResults = useCallback(async(query: string) => {
        if (!query) return
        
        setResults([])
        try {
            const result = ethers.getAddress(query)
            setResults([{owner: result}])
        } catch(e) {
            console.log(e)
        }
    }, [setResults])

    useEffect(() => {
        const delayInputTimeoutId = setTimeout(() => {
            console.log({query})
            fetchResults(query);
          }, 500);
          return () => clearTimeout(delayInputTimeoutId);
    }, [query, fetchResults])
    return (
        <Dialog 
            open={open}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {"Setup address"}
            </DialogTitle>
            <DialogContent style={{ padding: "8px" }}>
                <TextField 
                    label="Owner Address"
                    variant="standard"
                    value={query}
                    onChange={ (e) => setQuery(e.target.value)}
                    style={{ margin: "8px" }}
                    />
                {results.length == 0 && (
                    <DialogContentText style={{ paddingTop: "8px" }}>No results</DialogContentText>
                )}
                {results.map((result) => (
                    <Card style={{ margin: "8px" }}>
                        <CardActionArea onClick={ () => 
                            handleSelect(result.owner)
                        }>
                            <CardContent>{result.owner}</CardContent>   
                        </CardActionArea>
                    </Card>
                ))}
            </DialogContent>
        </Dialog>
    )
}