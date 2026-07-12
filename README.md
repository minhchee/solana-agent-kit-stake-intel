# solana-agent-kit-stake-intel

A drop-in plugin that gives the Solana Agent Kit a missing capability: reading
the live activation state of a stake account.

## What it does

`stake-intel` adds one agent method:

- `getStakeStatus(stakeAccount)` returns the live activation state of a stake
  account (`active` / `activating` / `deactivating` / `inactive`), the amount of
  SOL currently active and cooling down, and the delegated validator (vote
  account).

It wraps the RPC `getStakeActivation` call, which the Solana Agent Kit core does
not expose, and enriches it with the delegated validator pulled from parsed
account info.

## Why this is useful

The Solana Agent Kit today can stake and query balances, but has no way to tell
an agent the *state* of a stake account before acting. Searching the core repo,
references to `getStakeActivation` are effectively zero. This plugin closes that
gap so an autonomous agent can report delegation and avoid unstaking mistakes.

## Install

```bash
npm install solana-agent-kit-stake-intel
```

## Usage

```ts
import { SolanaAgentKit } from "solana-agent-kit";
import stakeIntel from "solana-agent-kit-stake-intel";

const agent = new SolanaAgentKit(/* ... */).use(stakeIntel);

const status = await agent.methods.getStakeStatus(
  "9We6QjU5pMYHjJn9RPRcGbLZCAfYvuq9Tf6HrQAd8w7X",
);
// { state: "active", activeSol: 12.5, inactiveSol: 0, delegatedValidator: "Vote1..." }
```

## API

`getStakeStatus(stakeAccount: string): Promise<StakeStatus>`

```ts
interface StakeStatus {
  address: string;
  state: "active" | "activating" | "deactivating" | "inactive" | "unknown";
  activeSol: number;
  inactiveSol: number;
  delegatedValidator: string | null;
}
```

## Demo

The demo runs without building the package. Pass any mainnet stake account:

```bash
node examples/demo.mjs <stake-account-address>
```

Example output:

```json
{
  "address": "9We6QjU5pMYHjJn9RPRcGbLZCAfYvuq9Tf6HrQAd8w7X",
  "state": "active",
  "activeSol": 12.5,
  "inactiveSol": 0,
  "delegatedValidator": "Vote111111111111111111111111111111111111111"
}
```

## Notes

The plugin uses `getStakeActivation` plus `getParsedAccountInfo`. No manual
binary offset math is used, so results are stable across RPC providers. The
delegated validator lookup is best-effort and never fails the call.

## License

MIT
