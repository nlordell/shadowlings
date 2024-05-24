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

interface LocationResult {
    lat: string,
    lon: string,
    entropy: string,
    name: string
}

export interface Props {
    open: boolean,
    handleSelect: (entropy: string) => void
}

export default function LocationDialog({ open, handleSelect }: Props): JSX.Element {
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<Array<LocationResult>>([])

    const fetchResults = useCallback(async(query: string) => {
        if (!query) return
        const searchParams = new URLSearchParams({
            format: "json",
            q: query
        })
        const rawResp = await fetch("https://nominatim.openstreetmap.org/search?" + searchParams)
        const jsonResp = await rawResp.json()
        setResults(jsonResp.map((result: any) => { return {
            lat: result.lat,
            lon: result.lon,
            entropy: encodeBase32(result.lat, result.lon, 7),
            name: result.display_name
        }}))
    }, [setResults])

    useEffect(() => {
        console.log("delayInputTimeoutId")
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
                {"Setup entropy with location"}
            </DialogTitle>
            <DialogContent style={{ padding: "8px" }}>
                <TextField 
                    label="Search Location"
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
                            handleSelect(result.entropy)
                        }>
                            <CardContent>{result.name}</CardContent>   
                        </CardActionArea>
                    </Card>
                ))}
            </DialogContent>
        </Dialog>
    )
}