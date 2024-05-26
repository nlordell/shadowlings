# Shadowlings

Shadow deposit accounts using Nick's method and ZKP.

## TODO

- Run Safe transaction service (Richard)
- Host Safe UI (Richard)

# Setup

- `git submodule update --init --recursive`
- `cd docker && docker compose up -d`

# Demo

- Create Safe: 
  - `yarn safe create --l2 --factory 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67 --singleton 0x29fcB43b46531BcA003ddC8FCB67FFE91900C762`

- Fund Safe:
  - `pnpm run tools:fund --to 0x04Cc094eBDf8ada9e5DcbDEb47ADC1DDc7C8E63C --amount 0.42`

- Trigger recovery:
  - `yarn safe submit-multi 0x0330Ca64d6FED94e9392EB212b27B129055a0A2b examples/shadowling_recovery_encoded.json`
  - `pnpm run tools:recover --to 0x0330Ca64d6FED94e9392EB212b27B129055a0A2b --data`