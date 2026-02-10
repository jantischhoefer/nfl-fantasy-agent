import { readFile, writeFile, stat } from "node:fs/promises";
import { config } from "../config.js";
import { getAllPlayers } from "./sleeper-client.js";
import type { PlayerMap } from "../types/sleeper.js";

interface CacheFile {
  updatedAt: string;
  players: PlayerMap;
}

/**
 * Returns the player map, loading from a local cache file if fresh enough,
 * otherwise fetching from the Sleeper API and persisting to disk.
 */
export async function getPlayerMap(): Promise<PlayerMap> {
  const cachePath = config.playerCachePath;

  // Check if cache exists and is fresh
  try {
    const fileStat = await stat(cachePath);
    const age = Date.now() - fileStat.mtimeMs;
    if (age < config.playerCacheMaxAge) {
      console.log("Loading player map from cache...");
      const raw = await readFile(cachePath, "utf-8");
      const cache: CacheFile = JSON.parse(raw);
      return cache.players;
    }
  } catch {
    // Cache doesn't exist or is unreadable -- will fetch fresh
  }

  console.log("Fetching full player database from Sleeper (~5MB)...");
  const players = await getAllPlayers();

  const cache: CacheFile = {
    updatedAt: new Date().toISOString(),
    players,
  };
  await writeFile(cachePath, JSON.stringify(cache), "utf-8");
  console.log(`Player cache written to ${cachePath}`);

  return players;
}

/** Resolve a player ID to a human-readable name */
export function resolvePlayerName(
  playerMap: PlayerMap,
  playerId: string
): string {
  const player = playerMap[playerId];
  if (!player) {
    // Could be a defense/special teams (e.g. "DET", "PHI")
    if (/^[A-Z]{2,3}$/.test(playerId)) {
      return `${playerId} D/ST`;
    }
    return `Unknown (${playerId})`;
  }
  const pos = player.position ?? "";
  const team = player.team ?? "";
  return `${player.first_name} ${player.last_name} (${pos} - ${team})`;
}

/** Resolve a player ID to just first + last name */
export function resolvePlayerShortName(
  playerMap: PlayerMap,
  playerId: string
): string {
  const player = playerMap[playerId];
  if (!player) {
    if (/^[A-Z]{2,3}$/.test(playerId)) {
      return `${playerId} D/ST`;
    }
    return `Unknown (${playerId})`;
  }
  return `${player.first_name} ${player.last_name}`;
}
