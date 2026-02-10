import { config } from "../../config.js";
import {
  getNflState,
  getLeague,
  getLeagueUsers,
  getRosters,
  getMatchups,
  getTransactions,
} from "../../services/sleeper-client.js";
import { getPlayerMap } from "../../services/player-cache.js";
import type { WeeklyLeagueData } from "../../types/sleeper.js";
import type { AgentStateType } from "../state.js";

/**
 * Graph node: Fetches all league data from Sleeper for the target week.
 * If leagueData is already present in state (e.g. from simulation), skips
 * fetching entirely.
 * If no week is specified in state, uses the current NFL week (minus 1 for
 * completed games).
 */
export async function collectDataNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // If leagueData was already injected (simulation mode), skip API calls
  if (state.leagueData) {
    console.log(
      `📦 Using pre-loaded league data (${state.leagueData.league.name}, Week ${state.leagueData.week})`
    );
    return { leagueData: state.leagueData, week: state.leagueData.week };
  }

  const leagueId = config.leagueId;

  console.log("📡 Fetching NFL state...");
  const nflState = await getNflState();

  // Determine the week: use state.week if provided, otherwise the most
  // recently completed week (current week - 1 during the season).
  let week = state.week;
  if (week === null || week === undefined) {
    week = Math.max(1, nflState.week - 1);
    console.log(
      `No week specified, using most recently completed week: ${week}`
    );
  }

  const season = nflState.season;

  console.log(
    `📡 Fetching league data for ${season} Week ${week} (League: ${leagueId})...`
  );

  // Fetch everything in parallel
  const [league, users, rosters, matchups, transactions, playerMap] =
    await Promise.all([
      getLeague(leagueId),
      getLeagueUsers(leagueId),
      getRosters(leagueId),
      getMatchups(leagueId, week),
      getTransactions(leagueId, week),
      getPlayerMap(),
    ]);

  console.log(
    `✅ Data collected: ${matchups.length} matchup entries, ${transactions.length} transactions, ${Object.keys(playerMap).length} players in cache`
  );

  if (matchups.length === 0) {
    throw new Error(
      `No matchups found for Week ${week}. The season may not have started yet, or this week hasn't been played.`
    );
  }

  const leagueData: WeeklyLeagueData = {
    nflState,
    league,
    users,
    rosters,
    matchups,
    transactions,
    playerMap,
    week,
    season,
  };

  return { leagueData, week };
}
