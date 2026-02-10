import { config } from "../config.js";
import type {
  NflState,
  League,
  LeagueUser,
  Roster,
  Matchup,
  Transaction,
  PlayerMap,
} from "../types/sleeper.js";

const BASE = config.sleeperBaseUrl;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited — wait and retry
        console.warn(
          `Rate limited by Sleeper API, retrying in ${RETRY_DELAY_MS * attempt}ms... (attempt ${attempt}/${MAX_RETRIES})`
        );
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(
          `Sleeper API error: ${response.status} ${response.statusText} for ${url}`
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        console.warn(
          `Request failed (attempt ${attempt}/${MAX_RETRIES}): ${lastError.message}. Retrying...`
        );
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`);
}

/** Get the current NFL state (week, season, etc.) */
export async function getNflState(): Promise<NflState> {
  return fetchJson<NflState>(`${BASE}/state/nfl`);
}

/** Get league metadata */
export async function getLeague(leagueId: string): Promise<League> {
  return fetchJson<League>(`${BASE}/league/${leagueId}`);
}

/** Get all users in a league */
export async function getLeagueUsers(
  leagueId: string
): Promise<LeagueUser[]> {
  return fetchJson<LeagueUser[]>(`${BASE}/league/${leagueId}/users`);
}

/** Get all rosters in a league */
export async function getRosters(leagueId: string): Promise<Roster[]> {
  return fetchJson<Roster[]>(`${BASE}/league/${leagueId}/rosters`);
}

/** Get matchups for a specific week */
export async function getMatchups(
  leagueId: string,
  week: number
): Promise<Matchup[]> {
  return fetchJson<Matchup[]>(`${BASE}/league/${leagueId}/matchups/${week}`);
}

/** Get transactions (waivers, trades, free agent pickups) for a specific week */
export async function getTransactions(
  leagueId: string,
  week: number
): Promise<Transaction[]> {
  return fetchJson<Transaction[]>(
    `${BASE}/league/${leagueId}/transactions/${week}`
  );
}

/** Fetch the full player database (~5MB). Call sparingly, cache results. */
export async function getAllPlayers(): Promise<PlayerMap> {
  return fetchJson<PlayerMap>(`${BASE}/players/nfl`);
}
