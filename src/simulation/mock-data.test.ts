import { describe, it, expect } from "vitest";
import { generateMockLeagueData } from "./mock-data.js";
import { buildPlayerMap } from "./players.js";

describe("generateMockLeagueData", () => {
  const data = generateMockLeagueData(5);

  it("should generate data for the correct week", () => {
    expect(data.week).toBe(5);
    expect(data.season).toBe("2025");
  });

  it("should have a named league", () => {
    expect(data.league.name).toBeTruthy();
    expect(data.league.total_rosters).toBe(10);
    expect(data.league.status).toBe("in_season");
  });

  it("should have 10 users", () => {
    expect(data.users).toHaveLength(10);
    for (const user of data.users) {
      expect(user.user_id).toBeTruthy();
      expect(user.display_name).toBeTruthy();
      expect(user.metadata.team_name).toBeTruthy();
    }
  });

  it("should have 10 rosters with valid structure", () => {
    expect(data.rosters).toHaveLength(10);
    for (const roster of data.rosters) {
      expect(roster.roster_id).toBeGreaterThanOrEqual(1);
      expect(roster.roster_id).toBeLessThanOrEqual(10);
      expect(roster.owner_id).toBeTruthy();

      // Each roster should have 9 starters (QB, 2 RB, 2 WR, TE, FLEX, K, DEF)
      expect(roster.starters).toHaveLength(9);

      // Each roster should have ~11-12 total players
      expect(roster.players.length).toBeGreaterThanOrEqual(10);
      expect(roster.players.length).toBeLessThanOrEqual(14);

      // All starters should be in the players list
      for (const starter of roster.starters) {
        expect(roster.players).toContain(starter);
      }
    }
  });

  it("should have 10 matchup entries (5 matchups x 2 teams)", () => {
    expect(data.matchups).toHaveLength(10);

    // Should have exactly 5 unique matchup IDs
    const matchupIds = new Set(data.matchups.map((m) => m.matchup_id));
    expect(matchupIds.size).toBe(5);

    // Each matchup ID should appear exactly twice
    for (const id of matchupIds) {
      const count = data.matchups.filter((m) => m.matchup_id === id).length;
      expect(count).toBe(2);
    }
  });

  it("should have valid point totals in matchups", () => {
    for (const matchup of data.matchups) {
      expect(matchup.points).toBeGreaterThanOrEqual(0);
      expect(matchup.points).toBeLessThan(250); // sanity check

      // Points should be the sum of starter points
      expect(matchup.players_points).toBeDefined();
      const starterPointsSum = matchup.starters.reduce(
        (sum, pid) => sum + (matchup.players_points[pid] ?? 0),
        0
      );
      // Allow small floating point tolerance from rounding
      expect(Math.abs(matchup.points - starterPointsSum)).toBeLessThan(0.1);
    }
  });

  it("should have per-player points for all rostered players", () => {
    for (const matchup of data.matchups) {
      for (const pid of matchup.players) {
        expect(matchup.players_points).toHaveProperty(pid);
        expect(matchup.players_points[pid]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("should have some transactions", () => {
    expect(data.transactions.length).toBeGreaterThanOrEqual(2);
    for (const tx of data.transactions) {
      expect(tx.status).toBe("complete");
      expect(["waiver", "free_agent"]).toContain(tx.type);
      expect(tx.adds).toBeTruthy();
    }
  });

  it("should have a populated player map", () => {
    const playerIds = Object.keys(data.playerMap);
    expect(playerIds.length).toBeGreaterThan(100);
  });

  it("should produce deterministic results for the same week", () => {
    const data2 = generateMockLeagueData(5);
    expect(data.matchups.map((m) => m.points)).toEqual(
      data2.matchups.map((m) => m.points)
    );
  });

  it("should produce different results for different weeks", () => {
    const week3 = generateMockLeagueData(3);
    const week7 = generateMockLeagueData(7);
    // Points should differ (extremely unlikely to be identical)
    expect(week3.matchups.map((m) => m.points)).not.toEqual(
      week7.matchups.map((m) => m.points)
    );
  });
});

describe("buildPlayerMap", () => {
  const playerMap = buildPlayerMap();

  it("should have over 100 players", () => {
    expect(Object.keys(playerMap).length).toBeGreaterThan(100);
  });

  it("should have defense teams", () => {
    expect(playerMap["SF"]).toBeDefined();
    expect(playerMap["SF"].position).toBe("DEF");
    expect(playerMap["SF"].last_name).toBe("D/ST");
  });

  it("should have correctly structured player entries", () => {
    const mahomes = Object.values(playerMap).find(
      (p) => p.last_name === "Mahomes"
    );
    expect(mahomes).toBeDefined();
    expect(mahomes!.first_name).toBe("Patrick");
    expect(mahomes!.position).toBe("QB");
    expect(mahomes!.team).toBe("KC");
  });
});
