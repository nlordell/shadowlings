# Shadowlings

We want privacy! We want recoverability! And Shadowlings gives that to us and pushes the freedom to transact to a new level.

Shadowlings generates unique and disposable deposit addresses that appear to be clean EOAs but are supercharged using EIP-3074 and ERC-4337. Additionally these deposit addresses can be connected to your existing account without doxing yourself using the power of Zero Knowledge. With that you can utilize recoverability mechanisms of an existing smart account and don’t have to worry about losing access to your shadow accounts.

With this we empower users to freely and privately transact without needing to manage multiple private keys, or being bothered by the wary eyes of other participants.

## Technical Highlights

- Three Zero Knowledge Proof Circuits
- Possible to use the contracts with a CLI or a web app
- Local (and dockerized) EIP-3074 and ERC-4337 setup (including bundlers)
- Gaslessly operate shadow accounts
- Nick’s method paired with EIP-3074 for managing shadow accounts without any private keys

## Setup

### Environment

- Store a mnemonic for the bundler account in `docker/data/bundler/mnemonic.txt`

### Commands

- `git submodule update --init --recursive`
- `pnpm i`
- `pnpm run circuits:compile`
- `cd docker && docker compose up -d`
- `pnpm run app:run`

# Demo

- Create Safe: 
  - `yarn safe create --nonce 0 --l2 --factory 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67 --singleton 0x29fcB43b46531BcA003ddC8FCB67FFE91900C762`

- Fund Safe:
  - `pnpm run tools:fund --to 0x04Cc094eBDf8ada9e5DcbDEb47ADC1DDc7C8E63C --amount 0.42`

- Trigger recovery:
  - `yarn safe submit-multi 0xa2b04c6a053AB2EFBC699f5DD0F0957742A41629 examples/shadowling_recovery_encoded.json`