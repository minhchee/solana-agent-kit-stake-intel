import type { SolanaAgentKit } from "solana-agent-kit";
import { z } from "zod";
import { getStakeStatus, type StakeStatus } from "./stake";

const StakeIntelPlugin = {
  name: "stake-intel",
  init(agent: SolanaAgentKit) {
    agent.methods.getStakeStatus = async (
      _agent: SolanaAgentKit,
      stakeAccount: string,
    ): Promise<StakeStatus> => {
      return getStakeStatus(agent.connection as never, stakeAccount);
    };

    agent.actions.push({
      name: "get_stake_status",
      similes: [
        "stake status",
        "is my stake active",
        "stake activation state",
        "check staking position",
        "what validator is this stake delegated to",
      ],
      description:
        "Return the live activation state of a Solana stake account (active / activating / deactivating / inactive) plus the delegated validator, using getStakeActivation. Use this to inspect a staking position before unstaking, or to report delegation in an agent workflow.",
      examples: [
        {
          input: { stakeAccount: "<any mainnet stake account address>" },
          output: {
            status: "success",
            data: {
              state: "active",
              activeSol: 12.5,
              inactiveSol: 0,
              delegatedValidator:
                "Vote111111111111111111111111111111111111111",
            },
          },
          explanation:
            "Returns the live staking state and the delegated validator for a stake account.",
        },
      ],
      schema: z.object({ stakeAccount: z.string().min(32).max(44) }),
      handler: async (
        _agent: SolanaAgentKit,
        params: { stakeAccount: string },
      ) => {
        const status = await getStakeStatus(
          agent.connection as never,
          params.stakeAccount,
        );
        return { status: "success", data: status };
      },
    });
  },
};

export default StakeIntelPlugin;
