import {
  Connection,
  PublicKey,
  type ParsedAccountData,
} from "@solana/web3.js";

export interface StakeStatus {
  address: string;
  /** live activation state returned by getStakeActivation */
  state: "active" | "activating" | "deactivating" | "inactive" | "unknown";
  /** lamports currently active, expressed in SOL */
  activeSol: number;
  /** lamports cooling down (not yet withdrawable), expressed in SOL */
  inactiveSol: number;
  /** vote account this stake is delegated to, if any */
  delegatedValidator: string | null;
}

/**
 * Return the live activation state of a stake account.
 *
 * Wraps the RPC `getStakeActivation` call (which the Solana Agent Kit does
 * not expose) and enriches it with the delegated validator pulled from the
 * parsed account info. No manual binary offset math is used, so the result
 * is stable across RPC providers.
 */
export async function getStakeStatus(
  connection: Connection,
  stakeAccount: string,
): Promise<StakeStatus> {
  const pubkey = new PublicKey(stakeAccount);
  const activation = await connection.getStakeActivation(pubkey, "confirmed");

  let delegatedValidator: string | null = null;
  try {
    const parsed = await connection.getParsedAccountInfo(pubkey);
    const data = parsed.value?.data as ParsedAccountData | undefined;
    if (data && typeof data === "object" && "parsed" in data) {
      delegatedValidator =
        (data.parsed as { info?: { stake?: { delegation?: { voter?: string } } } })
          .info?.stake?.delegation?.voter ?? null;
    }
  } catch {
    // delegated validator is best-effort; activation state is the source of truth
  }

  return {
    address: stakeAccount,
    state: activation.state as StakeStatus["state"],
    activeSol: activation.active / 1e9,
    inactiveSol: activation.inactive / 1e9,
    delegatedValidator,
  };
}
