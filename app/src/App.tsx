import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import LocationDialog from "./setup/LocationDialog";
import { Stack, Typography } from "@mui/material";
import OwnerDialog from "./setup/OwnerDialog";
import ShadowList from "./shadows/ShadowList";

function App() {
  const [showOwnerDialog, setShowOwnersDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [owner, setOwner] = useState(localStorage.getItem("owner"));
  const [entropy, setEntropy] = useState(localStorage.getItem("entropy"));
  useEffect(() => {
    setShowOwnersDialog(false);
    setShowLocationDialog(false);
    if (!owner) {
      setShowOwnersDialog(true);
    } else if (!entropy) {
      setShowLocationDialog(true);
    }
  }, [owner, entropy]);
  const clearEntropy = useCallback(() => {
    localStorage.removeItem("entropy");
    setEntropy("");
  }, [setEntropy]);
  const clearOwner = useCallback(() => {
    localStorage.removeItem("owner");
    setOwner("");
  }, [setOwner]);
  return (
    <div className="App">
      <LocationDialog
        open={showLocationDialog}
        handleSelect={(entropy) => {
          localStorage.setItem("entropy", entropy);
          setEntropy(entropy);
        }}
      />
      <OwnerDialog
        open={showOwnerDialog}
        handleSelect={(owner) => {
          localStorage.setItem("owner", owner);
          setOwner(owner);
        }}
      />
      <Stack
        direction="row"
        spacing={2}
        width={"100%"}
        style={{ justifyContent: "center" }}
      >
        {!!entropy && (
          <Typography>
            Selected Entropy: {entropy} (<a onClick={clearEntropy}>clear</a>)
          </Typography>
        )}
        {!!owner && (
          <Typography>
            Selected Owner: {owner} (<a onClick={clearOwner}>clear</a>)
          </Typography>
        )}
      </Stack>
      {!!entropy && !!owner && <ShadowList owner={owner} entropy={entropy} />}
    </div>
  );
}

export default App;
