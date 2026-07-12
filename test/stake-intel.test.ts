import { describe, it, expect, vi } from "vitest";
import { getStakeStatus } from "../src/stake";

const fakeConnection: any = {
  getStakeActivation: vi.fn(async () => ({
    state: "active",
    active: 12_500_000_000,
    inactive: 0,
  })),
  getParsedAccountInfo: vi.fn(async () => ({
    value: {
      data: {
        parsed: {
          info: {
            stake: {
              delegation: {
                voter: "Vote111111111111111111111111111111111111111",
              },
            },
          },
        },
      },
    },
  })),
};

describe("getStakeStatus", () => {
  it("maps activation state and divides lamports into SOL", async () => {
    const s = await getStakeStatus(
      fakeConnection,
      "9We6QjU5pMYHjJn9RPRcGbLZCAfYvuq9Tf6HrQAd8w7X",
    );
    expect(s.state).toBe("active");
    expect(s.activeSol).toBe(12.5);
    expect(s.inactiveSol).toBe(0);
  });

  it("extracts the delegated validator from parsed account info", async () => {
    const s = await getStakeStatus(
      fakeConnection,
      "9We6QjU5pMYHjJn9RPRcGbLZCAfYvuq9Tf6HrQAd8w7X",
    );
    expect(s.delegatedValidator).toBe(
      "Vote111111111111111111111111111111111111111",
    );
  });

  it("reports inactive stake as cooling down", async () => {
    fakeConnection.getStakeActivation = vi.fn(async () => ({
      state: "deactivating",
      active: 0,
      inactive: 5_000_000_000,
    }));
    const s = await getStakeStatus(
      fakeConnection,
      "9We6QjU5pMYHjJn9RPRcGbLZCAfYvuq9Tf6HrQAd8w7X",
    );
    expect(s.state).toBe("deactivating");
    expect(s.inactiveSol).toBe(5);
  });
});
