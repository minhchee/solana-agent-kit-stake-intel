// Standalone demo: works without building the package.
// Usage: node examples/demo.mjs <stake-account-address>
import { Connection, PublicKey } from "@solana/web3.js";

const RPC = process.env.SOLANA_RPC || "https://solana-rpc.publicnode.com";
const connection = new Connection(RPC, "confirmed");

async function getStakeStatus(connection, stakeAccount) {
  const pubkey = new PublicKey(stakeAccount);
  const activation = await connection.getStakeActivation(pubkey, "confirmed");
  let delegatedValidator = null;
  try {
    const parsed = await connection.getParsedAccountInfo(pubkey);
    const d = parsed.value?.data;
    if (d && typeof d === "object" && "parsed" in d) {
      delegatedValidator = d.parsed.info?.stake?.delegation?.voter ?? null;
    }
  } catch {
    // best-effort
  }
  return {
    address: stakeAccount,
    state: activation.state,
    activeSol: activation.active / 1e9,
    inactiveSol: activation.inactive / 1e9,
    delegatedValidator,
  };
}

const arg = process.argv[2];
if (!arg) {
  console.log("Usage: node examples/demo.mjs <stake-account-address>");
  console.log("Pass any mainnet stake account to see its live activation state.");
  process.exit(0);
}

const status = await getStakeStatus(connection, arg);
console.log(JSON.stringify(status, null, 2));
