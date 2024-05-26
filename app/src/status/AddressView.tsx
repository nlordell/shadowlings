import { ButtonBase, Stack, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import * as blockies from "blockies-ts";
import { ethers } from "ethers";
import { useMemo } from "react";
import { copyToClipboard } from "../utils/clipboard";

export interface Props {
  address: string;
  size: number;
  info?: string;
}

export default function AddressView(
  { address, size, info }: Props,
): JSX.Element {
  const addressImg = useMemo(
    () => blockies.create({ seed: address, scale: size }).toDataURL(),
    [address],
  );
  const checkedAddress = useMemo(() => ethers.getAddress(address), [address]);
  return (
    <Stack direction="row">
      <img src={addressImg} height={size} width={size} />
      <Typography
        height={size}
        width={"100%"}
        style={{ alignContent: "center" }}
        fontFamily="monospace"
      >
        <b>{checkedAddress.slice(0, 6)}</b>
        {checkedAddress.slice(6, 21)}
        <br />
        {checkedAddress.slice(21, 36)}
        <b>{checkedAddress.slice(36, 42)}</b>
      </Typography>

      <ButtonBase onClick={() => copyToClipboard({ value: checkedAddress })}>
        <ContentCopyIcon style={{ padding: "18px 6px 18px 6px" }} />
      </ButtonBase>
      {info && (
        <Tooltip title={info}>
          <InfoIcon style={{ padding: "18px 6px 18px 6px" }} />
        </Tooltip>
      )}
    </Stack>
  );
}
