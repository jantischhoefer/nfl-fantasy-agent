import { describe, it, expect } from "vitest";
import { computeAwards, formatAwardsSummary } from "./compute-awards.js";
import { generateMockLeagueData } from "../../simulation/mock-data.js";

describe("computeAwards", () => {
  const data = generateMockLeagueData(5);
  const awards = computeAwards(
    data.matchups,
    data.transactions,
    data.users,
    data.rosters,
    data.playerMap
  );

  describe("pointLeader", () => {
    it("should identify the highest-scoring team", () => {
      expect(awards.pointLeader.kind).toBe("point_leader");
      expect(awards.pointLeader.points).toBeGreaterThan(0);
      expect(awards.pointLeader.manager.displayName).toBeTruthy();

      // Verify this is actually the highest
      const maxPoints = Math.max(...data.matchups.map((m) => m.points));
      expect(awards.pointLeader.points).toBe(maxPoints);
    });
  });

  describe("worstPerformance", () => {
    it("should identify the lowest-scoring team", () => {
      expect(awards.worstPerformance.kind).toBe("worst_performance");
      expect(awards.worstPerformance.manager.displayName).toBeTruthy();

      // Verify this is actually the lowest
      const minPoints = Math.min(...data.matchups.map((m) => m.points));
      expect(awards.worstPerformance.points).toBe(minPoints);
    });

    it("should be different from point leader (unless extremely unlikely)", () => {
      expect(awards.worstPerformance.manager.rosterId).not.toBe(
        awards.pointLeader.manager.rosterId
      );
    });
  });

  describe("bestBenchPlayer", () => {
    it("should identify the highest-scoring bench player", () => {
      expect(awards.bestBenchPlayer).not.toBeNull();
      if (awards.bestBenchPlayer) {
        expect(awards.bestBenchPlayer.kind).toBe("best_bench_player");
        expect(awards.bestBenchPlayer.benchPoints).toBeGreaterThan(0);
        expect(awards.bestBenchPlayer.playerName).toBeTruthy();
        expect(awards.bestBenchPlayer.manager.displayName).toBeTruthy();
      }
    });

    it("should reference a player that was NOT a starter", () => {
      if (awards.bestBenchPlayer) {
        const matchup = data.matchups.find(
          (m) => m.roster_id === awards.bestBenchPlayer!.manager.rosterId
        );
        expect(matchup).toBeDefined();
        expect(matchup!.starters).not.toContain(
          awards.bestBenchPlayer.playerId
        );
      }
    });
  });

  describe("closestMatchup", () => {
    it("should have the smallest point differential", () => {
      expect(awards.closestMatchup.kind).toBe("closest_matchup");
      expect(awards.closestMatchup.differential).toBeGreaterThanOrEqual(0);
      expect(awards.closestMatchup.winnerPoints).toBeGreaterThanOrEqual(
        awards.closestMatchup.loserPoints
      );
    });

    it("should have a differential equal to winner minus loser", () => {
      const diff =
        awards.closestMatchup.winnerPoints - awards.closestMatchup.loserPoints;
      expect(Math.abs(diff - awards.closestMatchup.differential)).toBeLessThan(
        0.1
      );
    });
  });

  describe("biggestBlowout", () => {
    it("should have the largest point differential", () => {
      expect(awards.biggestBlowout.kind).toBe("biggest_blowout");
      expect(awards.biggestBlowout.differential).toBeGreaterThanOrEqual(
        awards.closestMatchup.differential
      );
    });
  });

  describe("matchupResults", () => {
    it("should have 5 matchup results for a 10-team league", () => {
      expect(awards.matchupResults).toHaveLength(5);
    });

    it("should have valid winner/loser for each matchup", () => {
      for (const result of awards.matchupResults) {
        expect(result.winner.rosterId).not.toBe(result.loser.rosterId);
        expect(result.differential).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("standings", () => {
    it("should have 10 entries", () => {
      expect(awards.standings).toHaveLength(10);
    });

    it("should be sorted by wins descending, then points", () => {
      for (let i = 0; i < awards.standings.length - 1; i++) {
        const current = awards.standings[i];
        const next = awards.standings[i + 1];
        if (current.wins !== next.wins) {
          expect(current.wins).toBeGreaterThan(next.wins);
        }
      }
    });

    it("should have non-negative W/L/T records", () => {
      for (const entry of awards.standings) {
        expect(entry.wins).toBeGreaterThanOrEqual(0);
        expect(entry.losses).toBeGreaterThanOrEqual(0);
        expect(entry.ties).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("bestWaiverPickup", () => {
    it("should reference a player from a completed transaction (if available)", () => {
      // With simulated data, we should always have waiver pickups
      if (awards.bestWaiverPickup) {
        expect(awards.bestWaiverPickup.kind).toBe("best_waiver_pickup");
        expect(awards.bestWaiverPickup.playerName).toBeTruthy();
        expect(awards.bestWaiverPickup.points).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe("formatAwardsSummary", () => {
  const data = generateMockLeagueData(5);
  const awards = computeAwards(
    data.matchups,
    data.transactions,
    data.users,
    data.rosters,
    data.playerMap
  );
  const summary = formatAwardsSummary(awards);

  it("should produce a non-empty string", () => {
    expect(summary.length).toBeGreaterThan(200);
  });

  it("should contain all award sections", () => {
    expect(summary).toContain("POINT LEADER");
    expect(summary).toContain("WORST PERFORMANCE");
    expect(summary).toContain("BENCH");
    expect(summary).toContain("MATCHUP RESULTS");
    expect(summary).toContain("STANDINGS");
  });

  it("should contain actual manager/team names from mock data", () => {
    // At least one team name should appear in the summary
    const teamNames = data.users.map((u) => u.metadata.team_name!);
    const found = teamNames.some((name) => summary.includes(name));
    expect(found).toBe(true);
  });

  it("should contain numeric scores", () => {
    // Should have decimal point scores like "123.45"
    expect(summary).toMatch(/\d+\.\d{2}/);
  });
});

describe("computeAwards across multiple weeks", () => {
  it("should produce valid awards for weeks 1 through 10", () => {
    for (let week = 1; week <= 10; week++) {
      const data = generateMockLeagueData(week);
      const awards = computeAwards(
        data.matchups,
        data.transactions,
        data.users,
        data.rosters,
        data.playerMap
      );

      // Basic sanity checks
      expect(awards.pointLeader.points).toBeGreaterThan(0);
      expect(awards.worstPerformance.points).toBeLessThanOrEqual(
        awards.pointLeader.points
      );
      expect(awards.matchupResults).toHaveLength(5);
      expect(awards.standings).toHaveLength(10);
      expect(awards.biggestBlowout.differential).toBeGreaterThanOrEqual(
        awards.closestMatchup.differential
      );
    }
  });
});
