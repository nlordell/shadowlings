import React, { useCallback, useEffect, useState } from 'react';
import logo from './logo.svg';
import { ethers } from 'ethers';
import './App.css';
import artifactJson from './config/artifacts.json'
import keypairJson from './config/keypair.json'
import { Abi, CompilationArtifacts, initialize } from "zokrates-js";
import LocationDialog from './setup/LocationDialog';
import { Typography } from '@mui/material';
import OwnerDialog from './setup/OwnerDialog';
import ShadowList from './shadows/ShadowList';

interface PersistedArtifact {
  program: string,
  abi: Abi
}
const loadProvingKey = (): Uint8Array => {
  return ethers.getBytes(keypairJson.pk)
}

const loadPersistedArtifacts = (): PersistedArtifact => {
  return artifactJson as any
}

const loadArtifact = (): CompilationArtifacts => {
  const persisted = loadPersistedArtifacts()
  return {
    program: ethers.getBytes(persisted.program),
    abi: persisted.abi
  }
}

const createProof = async (account: string) => {
  const zok = await initialize()
  const provingKey = loadProvingKey()
  const artifact = loadArtifact()
  const {witness} = zok.computeWitness(artifact, ["2", "4"])
  const proof = zok.generateProof(
    artifact.program,
    witness,
    provingKey
  );
  console.log(proof)
}

function App() {
  const [showOwnerDialog, setShowOwnersDialog] = useState(false)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [owner, setOwner] = useState(localStorage.getItem("owner"))
  const [entropy, setEntropy] = useState(localStorage.getItem("entropy"))
  useEffect(() => {
    setShowOwnersDialog(false)
    setShowLocationDialog(false)
    if (!owner)
      setShowOwnersDialog(true)
    else if (!entropy)
      setShowLocationDialog(true)
  }, [owner, entropy])
  const clearEntropy = useCallback(() => {
    localStorage.removeItem("entropy")
    setEntropy("")
  }, [setEntropy])
  const clearOwner = useCallback(() => {
    localStorage.removeItem("owner")
    setOwner("")
  }, [setOwner])
  return (
    <div className="App">
      <LocationDialog open={showLocationDialog} handleSelect={(entropy) => {
        localStorage.setItem("entropy", entropy)
        setEntropy(entropy)
      }}/>
      <OwnerDialog open={showOwnerDialog} handleSelect={(owner) => {
        localStorage.setItem("owner", owner)
        setOwner(owner)
      }}/>
      {!!entropy && (<Typography>Selected Entropy: {entropy} (<a onClick={clearEntropy}>clear</a>)</Typography>)}
      {!!owner && (<Typography>Selected Owner: {owner} (<a onClick={clearOwner}>clear</a>)</Typography>)}
      {!!entropy && !!owner && (<ShadowList owner={owner} entropy={entropy} />)}
    </div>
  );
}

export default App;
