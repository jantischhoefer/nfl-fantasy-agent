import type {
  Matchup,
  Transaction,
  PlayerMap,
  LeagueUser,
  Roster,
} from "../../types/sleeper.js";
import {
  resolvePlayerName,
  resolvePlayerShortName,
} from "../../services/player-cache.js";

// ─── Award Types ────────────────────────────────────────────────────────────

export interface ManagerInfo {
  rosterId: number;
  userId: string;
  displayName: string;
  teamName: string;
}

export interface PointLeaderAward {
  kind: "point_leader";
  manager: ManagerInfo;
  points: number;
}

export interface WorstPerformanceAward {
  kind: "worst_performance";
  manager: ManagerInfo;
  points: number;
}

export interface BestBenchPlayerAward {
  kind: "best_bench_player";
  manager: ManagerInfo;
  playerName: string;
  playerId: string;
  benchPoints: number;
}

export interface BestWaiverPickupAward {
  kind: "best_waiver_pickup";
  manager: ManagerInfo;
  playerName: string;
  playerId: string;
  points: number;
  waiverBid: number | null;
}

export interface ClosestMatchupAward {
  kind: "closest_matchup";
  winner: ManagerInfo;
  loser: ManagerInfo;
  winnerPoints: number;
  loserPoints: number;
  differential: number;
}

export interface BiggestBlowoutAward {
  kind: "biggest_blowout";
  winner: ManagerInfo;
  loser: ManagerInfo;
  winnerPoints: number;
  loserPoints: number;
  differential: number;
}

export interface MatchupResult {
  matchupId: number;
  team1: { manager: ManagerInfo; points: number };
  team2: { manager: ManagerInfo; points: number };
  winner: ManagerInfo;
  loser: ManagerInfo;
  differential: number;
}

export interface WeeklyAwards {
  pointLeader: PointLeaderAward;
  worstPerformance: WorstPerformanceAward;
  bestBenchPlayer: BestBenchPlayerAward | null;
  bestWaiverPickup: BestWaiverPickupAward | null;
  closestMatchup: ClosestMatchupAward;
  biggestBlowout: BiggestBlowoutAward;
  matchupResults: MatchupResult[];
  standings: StandingEntry[];
}

export interface StandingEntry {
  manager: ManagerInfo;
  wins: number;
  losses: number;
  ties: number;
  totalPoints: number;
}

// ─── Helper: Build manager lookup ───────────────────────────────────────────

function buildManagerLookup(
  users: LeagueUser[],
  rosters: Roster[]
): Map<number, ManagerInfo> {
  const userById = new Map<string, LeagueUser>();
  for (const u of users) {
    userById.set(u.user_id, u);
  }

  const lookup = new Map<number, ManagerInfo>();
  for (const roster of rosters) {
    const user = userById.get(roster.owner_id);
    lookup.set(roster.roster_id, {
      rosterId: roster.roster_id,
      userId: roster.owner_id,
      displayName: user?.display_name ?? user?.username ?? "Unknown",
      teamName: user?.metadata?.team_name ?? user?.display_name ?? "Unknown",
    });
  }
  return lookup;
}

// ─── Main computation ───────────────────────────────────────────────────────

export function computeAwards(
  matchups: Matchup[],
  transactions: Transaction[],
  users: LeagueUser[],
  rosters: Roster[],
  playerMap: PlayerMap
): WeeklyAwards {
  const managers = buildManagerLookup(users, rosters);

  const getManager = (rosterId: number): ManagerInfo =>
    managers.get(rosterId) ?? {
      rosterId,
      userId: "unknown",
      displayName: "Unknown Manager",
      teamName: "Unknown Team",
    };

  // ── Group matchups by matchup_id ──────────────────────────────────────
  const matchupGroups = new Map<number, Matchup[]>();
  for (const m of matchups) {
    const group = matchupGroups.get(m.matchup_id) ?? [];
    group.push(m);
    matchupGroups.set(m.matchup_id, group);
  }

  // ── Matchup results ───────────────────────────────────────────────────
  const matchupResults: MatchupResult[] = [];
  for (const [matchupId, teams] of matchupGroups) {
    if (teams.length !== 2) continue;
    const [a, b] = teams;
    const aPoints = a.points ?? 0;
    const bPoints = b.points ?? 0;
    const winner = aPoints >= bPoints ? a : b;
    const loser = aPoints >= bPoints ? b : a;
    matchupResults.push({
      matchupId,
      team1: { manager: getManager(a.roster_id), points: aPoints },
      team2: { manager: getManager(b.roster_id), points: bPoints },
      winner: getManager(winner.roster_id),
      loser: getManager(loser.roster_id),
      differential: Math.abs(aPoints - bPoints),
    });
  }

  // ── Point leader & worst performance ──────────────────────────────────
  let pointLeaderMatchup: Matchup = matchups[0];
  let worstMatchup: Matchup = matchups[0];
  for (const m of matchups) {
    if ((m.points ?? 0) > (pointLeaderMatchup.points ?? 0)) {
      pointLeaderMatchup = m;
    }
    if ((m.points ?? 0) < (worstMatchup.points ?? 0)) {
      worstMatchup = m;
    }
  }

  const pointLeader: PointLeaderAward = {
    kind: "point_leader",
    manager: getManager(pointLeaderMatchup.roster_id),
    points: pointLeaderMatchup.points ?? 0,
  };

  const worstPerformance: WorstPerformanceAward = {
    kind: "worst_performance",
    manager: getManager(worstMatchup.roster_id),
    points: worstMatchup.points ?? 0,
  };

  // ── Best bench player ─────────────────────────────────────────────────
  let bestBenchPlayer: BestBenchPlayerAward | null = null;
  for (const m of matchups) {
    const starterSet = new Set(m.starters ?? []);
    const allPlayers = m.players ?? [];
    const playerPoints = m.players_points ?? {};

    for (const pid of allPlayers) {
      if (starterSet.has(pid)) continue; // skip starters
      const pts = playerPoints[pid] ?? 0;
      if (!bestBenchPlayer || pts > bestBenchPlayer.benchPoints) {
        bestBenchPlayer = {
          kind: "best_bench_player",
          manager: getManager(m.roster_id),
          playerName: resolvePlayerName(playerMap, pid),
          playerId: pid,
          benchPoints: pts,
        };
      }
    }
  }

  // ── Best waiver pickup ────────────────────────────────────────────────
  // Cross-reference completed waiver/free_agent transactions with matchup points
  const completedPickups = transactions.filter(
    (t) =>
      (t.type === "waiver" || t.type === "free_agent") &&
      t.status === "complete" &&
      t.adds
  );

  // Build a map: playerId -> points scored this week (across all matchups)
  const weeklyPlayerPoints = new Map<string, { points: number; rosterId: number }>();
  for (const m of matchups) {
    const playerPoints = m.players_points ?? {};
    for (const [pid, pts] of Object.entries(playerPoints)) {
      weeklyPlayerPoints.set(pid, { points: pts, rosterId: m.roster_id });
    }
  }

  let bestWaiverPickup: BestWaiverPickupAward | null = null;
  for (const tx of completedPickups) {
    if (!tx.adds) continue;
    for (const [playerId, rosterId] of Object.entries(tx.adds)) {
      const scored = weeklyPlayerPoints.get(playerId);
      if (!scored) continue;
      const pts = scored.points;
      if (!bestWaiverPickup || pts > bestWaiverPickup.points) {
        bestWaiverPickup = {
          kind: "best_waiver_pickup",
          manager: getManager(rosterId),
          playerName: resolvePlayerName(playerMap, playerId),
          playerId,
          points: pts,
          waiverBid: tx.settings?.waiver_bid ?? null,
        };
      }
    }
  }

  // ── Closest matchup & biggest blowout ─────────────────────────────────
  const sorted = [...matchupResults].sort(
    (a, b) => a.differential - b.differential
  );
  const closest = sorted[0];
  const blowout = sorted[sorted.length - 1];

  const closestMatchup: ClosestMatchupAward = {
    kind: "closest_matchup",
    winner: closest.winner,
    loser: closest.loser,
    winnerPoints:
      closest.team1.manager.rosterId === closest.winner.rosterId
        ? closest.team1.points
        : closest.team2.points,
    loserPoints:
      closest.team1.manager.rosterId === closest.loser.rosterId
        ? closest.team1.points
        : closest.team2.points,
    differential: closest.differential,
  };

  const biggestBlowout: BiggestBlowoutAward = {
    kind: "biggest_blowout",
    winner: blowout.winner,
    loser: blowout.loser,
    winnerPoints:
      blowout.team1.manager.rosterId === blowout.winner.rosterId
        ? blowout.team1.points
        : blowout.team2.points,
    loserPoints:
      blowout.team1.manager.rosterId === blowout.loser.rosterId
        ? blowout.team1.points
        : blowout.team2.points,
    differential: blowout.differential,
  };

  // ── Standings ─────────────────────────────────────────────────────────
  const standings: StandingEntry[] = rosters
    .map((r) => ({
      manager: getManager(r.roster_id),
      wins: r.settings.wins ?? 0,
      losses: r.settings.losses ?? 0,
      ties: r.settings.ties ?? 0,
      totalPoints:
        (r.settings.fpts ?? 0) +
        (r.settings.fpts_decimal ?? 0) / 100,
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalPoints - a.totalPoints;
    });

  return {
    pointLeader,
    worstPerformance,
    bestBenchPlayer,
    bestWaiverPickup,
    closestMatchup,
    biggestBlowout,
    matchupResults,
    standings,
  };
}

// ─── Format awards as a readable summary for the LLM ────────────────────────

export function formatAwardsSummary(awards: WeeklyAwards): string {
  const lines: string[] = [];

  lines.push("=== WEEKLY AWARDS ===\n");

  lines.push(
    `🏆 POINT LEADER: ${awards.pointLeader.manager.teamName} (${awards.pointLeader.manager.displayName}) with ${awards.pointLeader.points.toFixed(2)} points`
  );

  lines.push(
    `💩 WORST PERFORMANCE: ${awards.worstPerformance.manager.teamName} (${awards.worstPerformance.manager.displayName}) with ${awards.worstPerformance.points.toFixed(2)} points`
  );

  if (awards.bestBenchPlayer) {
    lines.push(
      `💺 BEST BENCH PLAYER: ${awards.bestBenchPlayer.playerName} on ${awards.bestBenchPlayer.manager.teamName}'s bench with ${awards.bestBenchPlayer.benchPoints.toFixed(2)} points`
    );
  }

  if (awards.bestWaiverPickup) {
    const bid = awards.bestWaiverPickup.waiverBid;
    const bidStr = bid !== null ? ` (FAAB bid: $${bid})` : "";
    lines.push(
      `🔄 BEST WAIVER PICKUP: ${awards.bestWaiverPickup.playerName} picked up by ${awards.bestWaiverPickup.manager.teamName}${bidStr} — scored ${awards.bestWaiverPickup.points.toFixed(2)} points`
    );
  }

  lines.push(
    `⚔️ CLOSEST MATCHUP: ${awards.closestMatchup.winner.teamName} (${awards.closestMatchup.winnerPoints.toFixed(2)}) beat ${awards.closestMatchup.loser.teamName} (${awards.closestMatchup.loserPoints.toFixed(2)}) by ${awards.closestMatchup.differential.toFixed(2)} points`
  );

  lines.push(
    `💥 BIGGEST BLOWOUT: ${awards.biggestBlowout.winner.teamName} (${awards.biggestBlowout.winnerPoints.toFixed(2)}) crushed ${awards.biggestBlowout.loser.teamName} (${awards.biggestBlowout.loserPoints.toFixed(2)}) by ${awards.biggestBlowout.differential.toFixed(2)} points`
  );

  lines.push("\n=== MATCHUP RESULTS ===\n");
  for (const m of awards.matchupResults) {
    lines.push(
      `${m.team1.manager.teamName} (${m.team1.points.toFixed(2)}) vs ${m.team2.manager.teamName} (${m.team2.points.toFixed(2)}) — Winner: ${m.winner.teamName}`
    );
  }

  lines.push("\n=== STANDINGS ===\n");
  for (let i = 0; i < awards.standings.length; i++) {
    const s = awards.standings[i];
    lines.push(
      `${i + 1}. ${s.manager.teamName} (${s.manager.displayName}) — ${s.wins}W-${s.losses}L-${s.ties}T — ${s.totalPoints.toFixed(2)} PF`
    );
  }

  return lines.join("\n");
}
