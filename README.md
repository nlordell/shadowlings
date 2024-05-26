# Shadowlings

_**:warning: Disclaimer: This repository contains unaudited code, use at your
own risk:warning:**_

We want privacy! We want recoverability! And Shadowlings gives that to us and
pushes the freedom to transact to a new level.

Shadowlings generates unique and disposable deposit addresses that appear to be
clean EOAs but are supercharged using EIP-3074 and ERC-4337. Additionally these
deposit addresses can be connected to your existing account without doxing
yourself using the power of Zero Knowledge. With that you can utilize
recoverability mechanisms of an existing smart account and don’t have to worry
about losing access to your shadow accounts.

With this we empower users to freely and privately transact without needing to
manage multiple private keys, or being bothered by the wary eyes of other
participants.

## Technical Highlights

- Three Zero Knowledge Proof Circuits
- Possible to use the contracts with a CLI or a web app
- Local (and dockerized) EIP-3074 and ERC-4337 setup (including bundlers)
- Gaslessly operate shadow accounts
- Nick’s method paired with EIP-3074 for managing shadow accounts without any
  private keys

## Setup

1. Make sure the clone the repository with submodules:
   `git clone --recurse-submodules`.
   - If you already have the repository cloned, you can update the submodules
     with: `git submodule update --init --recursive`.
2. Install package dependencies: `pnpm install --frozen-lockfile`.
   - Note that this will compile the ZoKrates circuits. We have committed a
     trusted setup to facilitate development, **but should not be considered
     safe to use for production**.
   - If you plan to connect to a public test network, make sure to edit the file
     `docker/data/bundler/mnemonic.txt` with a mnemonic to use for the relayer
     account in the ERC-4337 bundler.
3. Host the interface and run a local development network with an ERC-4337
   bundler with Docker compose: `pnpm start`.
   - To shutdown the containers: `pnpm run docker:down`.
   - To fund local accounts for testing:
     `pnpm run tools:fund --demo --to <address> --amount <amount>`

## Development

### Front End Application - `app/`

The front end is a React-based application that implements creation, management
and recovery of Shadowling stealth addresses.

### Contracts - `contracts/`

The core contracts including the `Shadowlings` invoker contract that verifies
proofs and controls the shadowlings with EIP-3074. It also implements an
ERC-4337 account interface so that it can be used with the public bundler
network for submitting shadowling withdrawals, helping maintain anonymity by
having relayers submit shadowling transactions on-chain and take advantage of
gas abstraction.

### Circuits - `circuits/`

There are three separate ZoKrates circuits used in this project for various
proofs:

- The `main.zok` circuit which is used for proving ownership in order to control
  the shadowlings over the default privacy-preserving flow over ERC-4337.
- The `register.zok` circuit which is used for proving ownership in order to
  register recovery information with the `Shadowlings` contract.
- The `recover.zok` circuit which is proved for proving ownership in the
  recovery flow. This allows the owner to call the `Shadowlings` contract
  directly in order to interact with the stealth accounts (which would obviously
  dox the owner of the stealth account, but help recover funds that would
  otherwise be lost in case the ZK secrets are forgotten).

---

## Demo

- Create Safe:
  - `yarn safe create --nonce 0 --l2 --factory 0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67 --singleton 0x29fcB43b46531BcA003ddC8FCB67FFE91900C762`
- Trigger recovery:
  - `yarn safe submit-multi 0xa2b04c6a053AB2EFBC699f5DD0F0957742A41629 examples/shadowling_recovery_encoded.json`
