import type {
  NflState,
  League,
  LeagueUser,
  Roster,
  Matchup,
  Transaction,
  WeeklyLeagueData,
  PlayerMap,
} from "../types/sleeper.js";
import { buildPlayerMap, getPlayerSeeds, getDefenseTeams } from "./players.js";

// ─── Seeded random number generator (deterministic per week) ────────────────

function createRng(seed: number) {
  // Simple mulberry32 PRNG
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ─── Fantasy team names & managers ──────────────────────────────────────────

interface FantasyTeam {
  userId: string;
  username: string;
  displayName: string;
  teamName: string;
}

const FANTASY_TEAMS: FantasyTeam[] = [
  { userId: "u01", username: "gridiron_guru", displayName: "Mike", teamName: "Gridiron Gurus" },
  { userId: "u02", username: "td_machine", displayName: "Sarah", teamName: "Touchdown Machines" },
  { userId: "u03", username: "waiver_king", displayName: "Jake", teamName: "Waiver Wire Kings" },
  { userId: "u04", username: "benchwarmer", displayName: "Emma", teamName: "Benchwarmer Brigade" },
  { userId: "u05", username: "redzone_rob", displayName: "Rob", teamName: "Red Zone Rockets" },
  { userId: "u06", username: "fantasy_flop", displayName: "Lisa", teamName: "Fantasy Flops" },
  { userId: "u07", username: "qb_whisperer", displayName: "Tom", teamName: "QB Whisperers" },
  { userId: "u08", username: "trade_shark", displayName: "Priya", teamName: "Trade Sharks" },
  { userId: "u09", username: "sleeper_pick", displayName: "Carlos", teamName: "Sleeper Picks" },
  { userId: "u10", username: "dynasty_dan", displayName: "Dan", teamName: "Dynasty Destroyers" },
];

// ─── Draft simulation ───────────────────────────────────────────────────────

/**
 * Roster slots for a standard 10-team league:
 * 1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX (RB/WR/TE), 1 K, 1 DEF, 5 BN
 * = 14 players per team = 140 total picks
 */
interface DraftedRoster {
  qb: string[];   // 1 starter + 1 bench
  rb: string[];   // 2 starters + 1-2 bench
  wr: string[];   // 2 starters + 1-2 bench
  te: string[];   // 1 starter + 0-1 bench
  k: string[];    // 1
  def: string[];  // 1
}

function simulateDraft(rng: () => number): DraftedRoster[] {
  const seeds = getPlayerSeeds();
  const defenses = getDefenseTeams();

  const qbs = seeds.filter((p) => p.pos === "QB").map((p) => p.id);
  const rbs = seeds.filter((p) => p.pos === "RB").map((p) => p.id);
  const wrs = seeds.filter((p) => p.pos === "WR").map((p) => p.id);
  const tes = seeds.filter((p) => p.pos === "TE").map((p) => p.id);
  const ks = seeds.filter((p) => p.pos === "K").map((p) => p.id);

  // Slight shuffle to add variance (but keep general ADP order)
  const softShuffle = <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = 0; i < result.length; i++) {
      // Only swap with nearby elements
      const swapRange = Math.min(3, result.length - i - 1);
      if (swapRange > 0) {
        const j = i + Math.floor(rng() * (swapRange + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
    }
    return result;
  };

  const shuffledQbs = softShuffle(qbs);
  const shuffledRbs = softShuffle(rbs);
  const shuffledWrs = softShuffle(wrs);
  const shuffledTes = softShuffle(tes);
  const shuffledKs = softShuffle(ks);
  const shuffledDefs = softShuffle([...defenses]);

  let qbIdx = 0, rbIdx = 0, wrIdx = 0, teIdx = 0, kIdx = 0, defIdx = 0;

  const rosters: DraftedRoster[] = [];
  for (let i = 0; i < 10; i++) {
    rosters.push({
      qb: [shuffledQbs[qbIdx++], shuffledQbs[qbIdx++]],
      rb: [shuffledRbs[rbIdx++], shuffledRbs[rbIdx++], shuffledRbs[rbIdx++]],
      wr: [shuffledWrs[wrIdx++], shuffledWrs[wrIdx++], shuffledWrs[wrIdx++]],
      te: [shuffledTes[teIdx++]],
      k: [shuffledKs[kIdx++]],
      def: [shuffledDefs[defIdx++]],
    });
  }

  return rosters;
}

// ─── Point scoring simulation ───────────────────────────────────────────────

interface PointRange {
  min: number;
  max: number;
  boomChance: number; // chance of a big game
  boomMin: number;
  boomMax: number;
  bustChance: number; // chance of a dud
}

const POS_SCORING: Record<string, PointRange> = {
  QB: { min: 10, max: 28, boomChance: 0.15, boomMin: 30, boomMax: 42, bustChance: 0.1 },
  RB: { min: 4, max: 18, boomChance: 0.12, boomMin: 20, boomMax: 35, bustChance: 0.15 },
  WR: { min: 3, max: 18, boomChance: 0.12, boomMin: 22, boomMax: 38, bustChance: 0.15 },
  TE: { min: 2, max: 14, boomChance: 0.1, boomMin: 16, boomMax: 26, bustChance: 0.2 },
  K:  { min: 2, max: 14, boomChance: 0.08, boomMin: 15, boomMax: 20, bustChance: 0.1 },
  DEF: { min: 1, max: 15, boomChance: 0.1, boomMin: 16, boomMax: 25, bustChance: 0.15 },
};

function simulatePlayerPoints(
  rng: () => number,
  position: string,
  isStarter: boolean
): number {
  const range = POS_SCORING[position] ?? POS_SCORING["WR"];

  // Bench players score slightly less on average (selection bias)
  const penalty = isStarter ? 0 : 2;

  const roll = rng();
  let points: number;

  if (roll < range.bustChance) {
    // Bust game
    points = randomBetween(rng, 0, range.min);
  } else if (roll > 1 - range.boomChance) {
    // Boom game
    points = randomBetween(rng, range.boomMin, range.boomMax);
  } else {
    // Normal game
    points = randomBetween(rng, range.min, range.max);
  }

  return roundTo(Math.max(0, points - penalty), 2);
}

// ─── Assemble full mock data ────────────────────────────────────────────────

export function generateMockLeagueData(week: number): WeeklyLeagueData {
  const rng = createRng(week * 7919 + 42);
  const playerMap = buildPlayerMap();
  const draftedRosters = simulateDraft(rng);

  // ── NFL State ────────────────────────────────────────────────────────
  const nflState: NflState = {
    week: week + 1,
    season_type: "regular",
    season_start_date: "2025-09-04",
    season: "2025",
    previous_season: "2024",
    leg: week,
    league_season: "2025",
    league_create_season: "2025",
    display_week: week + 1,
  };

  // ── League ───────────────────────────────────────────────────────────
  const league: League = {
    total_rosters: 10,
    status: "in_season",
    sport: "nfl",
    settings: { max_keepers: 0, num_teams: 10, playoff_week_start: 15 },
    season_type: "regular",
    season: "2025",
    scoring_settings: {
      pass_yd: 0.04,
      pass_td: 4,
      pass_int: -2,
      rush_yd: 0.1,
      rush_td: 6,
      rec: 1, // PPR
      rec_yd: 0.1,
      rec_td: 6,
      fum_lost: -2,
    },
    roster_positions: [
      "QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF",
      "BN", "BN", "BN", "BN", "BN",
    ],
    previous_league_id: null,
    name: "Tischhoefer & Friends Fantasy League",
    league_id: "sim_league_001",
    draft_id: "sim_draft_001",
    avatar: null,
  };

  // ── Users ────────────────────────────────────────────────────────────
  const users: LeagueUser[] = FANTASY_TEAMS.map((t) => ({
    user_id: t.userId,
    username: t.username,
    display_name: t.displayName,
    avatar: null,
    metadata: { team_name: t.teamName },
    is_owner: t.userId === "u01",
  }));

  // ── Simulate cumulative record up to this week ───────────────────────
  // Generate plausible W-L records
  const cumulativeRecords = FANTASY_TEAMS.map((_, idx) => {
    let wins = 0;
    let losses = 0;
    for (let w = 1; w < week; w++) {
      const weekRng = createRng(w * 7919 + idx * 31 + 42);
      // Higher-indexed teams are slightly worse (draft order advantage)
      const winChance = 0.35 + (10 - idx) * 0.03;
      if (weekRng() < winChance) wins++;
      else losses++;
    }
    return { wins, losses };
  });

  // ── Rosters ──────────────────────────────────────────────────────────
  const rosters: Roster[] = draftedRosters.map((dr, idx) => {
    const allPlayers = [
      ...dr.qb, ...dr.rb, ...dr.wr, ...dr.te, ...dr.k, ...dr.def,
    ];
    // Starters: QB1, RB1, RB2, WR1, WR2, TE1, FLEX (RB3 or WR3), K1, DEF1
    const flexPlayer = rng() > 0.5 ? dr.rb[2] : dr.wr[2];
    const starters = [
      dr.qb[0], dr.rb[0], dr.rb[1], dr.wr[0], dr.wr[1],
      dr.te[0], flexPlayer, dr.k[0], dr.def[0],
    ];

    const totalFpts = Math.round(
      60 + cumulativeRecords[idx].wins * 25 + rng() * 200
    );

    return {
      starters,
      settings: {
        wins: cumulativeRecords[idx].wins,
        waiver_position: idx + 1,
        waiver_budget_used: Math.floor(rng() * 50),
        total_moves: Math.floor(rng() * 10),
        ties: 0,
        losses: cumulativeRecords[idx].losses,
        fpts: totalFpts,
        fpts_decimal: Math.floor(rng() * 100),
        fpts_against: Math.round(totalFpts - 50 + rng() * 100),
        fpts_against_decimal: Math.floor(rng() * 100),
      },
      roster_id: idx + 1,
      reserve: null,
      players: allPlayers,
      owner_id: FANTASY_TEAMS[idx].userId,
      league_id: "sim_league_001",
    };
  });

  // ── Matchups ─────────────────────────────────────────────────────────
  // 10 teams = 5 matchups
  const matchupPairs: [number, number][] = [];
  const shuffledTeamIdxs = Array.from({ length: 10 }, (_, i) => i);
  // Deterministic shuffle for pairings
  for (let i = shuffledTeamIdxs.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffledTeamIdxs[i], shuffledTeamIdxs[j]] = [shuffledTeamIdxs[j], shuffledTeamIdxs[i]];
  }
  for (let i = 0; i < 10; i += 2) {
    matchupPairs.push([shuffledTeamIdxs[i], shuffledTeamIdxs[i + 1]]);
  }

  const matchups: Matchup[] = [];
  for (let matchupId = 1; matchupId <= 5; matchupId++) {
    const [idxA, idxB] = matchupPairs[matchupId - 1];

    for (const teamIdx of [idxA, idxB]) {
      const roster = rosters[teamIdx];
      const playersPoints: Record<string, number> = {};

      for (const pid of roster.players) {
        const pos = getPlayerPosition(pid, playerMap);
        const isStarter = roster.starters.includes(pid);
        playersPoints[pid] = simulatePlayerPoints(rng, pos, isStarter);
      }

      const totalPoints = roundTo(
        Object.entries(playersPoints)
          .filter(([pid]) => roster.starters.includes(pid))
          .reduce((sum, [, pts]) => sum + pts, 0),
        2
      );

      matchups.push({
        starters: roster.starters,
        roster_id: roster.roster_id,
        players: roster.players,
        matchup_id: matchupId,
        points: totalPoints,
        custom_points: null,
        players_points: playersPoints,
      });
    }
  }

  // ── Transactions (simulate 2-4 waiver pickups) ───────────────────────
  const transactions: Transaction[] = [];
  const numTransactions = 2 + Math.floor(rng() * 3);

  // Pool of undrafted players to pick up
  const allDraftedIds = new Set(rosters.flatMap((r) => r.players));
  const seeds = getPlayerSeeds();
  const undrafted = seeds
    .filter((s) => !allDraftedIds.has(s.id))
    .map((s) => s.id);

  for (let i = 0; i < Math.min(numTransactions, undrafted.length); i++) {
    const rosterIdx = Math.floor(rng() * 10);
    const roster = rosters[rosterIdx];
    const addedPlayerId = undrafted[i];

    // Drop the last bench player
    const benchPlayers = roster.players.filter(
      (p) => !roster.starters.includes(p)
    );
    const droppedPlayerId = benchPlayers.length > 0
      ? benchPlayers[benchPlayers.length - 1]
      : null;

    const isWaiver = rng() > 0.4;
    transactions.push({
      type: isWaiver ? "waiver" : "free_agent",
      transaction_id: `sim_tx_${week}_${i}`,
      status_updated: Date.now() - Math.floor(rng() * 86400000),
      status: "complete",
      settings: isWaiver ? { waiver_bid: Math.floor(rng() * 30) + 1 } : null,
      roster_ids: [roster.roster_id],
      metadata: null,
      leg: week,
      drops: droppedPlayerId
        ? { [droppedPlayerId]: roster.roster_id }
        : null,
      draft_picks: [],
      creator: FANTASY_TEAMS[rosterIdx].userId,
      created: Date.now() - Math.floor(rng() * 86400000),
      consenter_ids: [roster.roster_id],
      adds: { [addedPlayerId]: roster.roster_id },
      waiver_budget: [],
    });
  }

  return {
    nflState,
    league,
    users,
    rosters,
    matchups,
    transactions,
    playerMap,
    week,
    season: "2025",
  };
}

function getPlayerPosition(playerId: string, playerMap: PlayerMap): string {
  const player = playerMap[playerId];
  if (player) return player.position ?? "WR";
  if (/^[A-Z]{2,3}$/.test(playerId)) return "DEF";
  return "WR";
}
