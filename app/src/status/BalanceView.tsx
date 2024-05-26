import { Button, Typography } from "@mui/material";
import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { globalProvier } from "../utils/web3";
import WithdrawDialog from "../transact/WithdrawDialog";
import { getToken, Token } from "../utils/tokens";

export interface Props {
  address: string;
  salt: string;
  token?: Token;
}

const loadBalances = async (
  address: string,
  token: Token | undefined,
): Promise<bigint> => {
  if (!token) {
    return globalProvier().getBalance(address);
  } else {
    const t = getToken(token.address);
    console.log(t);
    return await t.balanceOf(address);
  }
};

export default function BalanceView(
  { address, salt, token }: Props,
): JSX.Element {
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [balance, setBalance] = useState<string | undefined>();

  const refreshBalances = useCallback(
    async (address: string, token: Token | undefined) => {
      try {
        const balance = await loadBalances(address, token);
        setBalance(ethers.formatUnits(balance, token?.decimals));
      } catch (e) {
        console.error(e);
      }
    },
    [setBalance],
  );

  useEffect(() => {
    // TODO: don't query new task if previous one was not finished
    refreshBalances(address, token);
    const currentTask = setInterval(
      () => refreshBalances(address, token),
      5000,
    );
    return () => clearInterval(currentTask);
  }, [address, token]);
  return (
    <Typography>
      {token?.name || "Ether"}: {balance || "Loading..."}
      <Button size="small" onClick={() => setShowWithdrawDialog(true)}>
        Withdraw
      </Button>

      <WithdrawDialog
        open={showWithdrawDialog}
        shadowAddress={address}
        salt={salt}
        token={token}
        maxAmount={balance}
        handleClose={() => {
          setShowWithdrawDialog(false);
        }}
      />
    </Typography>
  );
}
