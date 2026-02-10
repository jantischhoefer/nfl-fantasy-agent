export const config = {
  sleeperBaseUrl: "https://api.sleeper.app/v1",
  leagueId: process.env.SLEEPER_LEAGUE_ID ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  playerCachePath: "players-cache.json",
  /** Max age of the player cache in ms (24 hours) */
  playerCacheMaxAge: 24 * 60 * 60 * 1000,
  outputDir: "output",
} as const;

export function validateConfig(): void {
  if (!config.leagueId) {
    throw new Error("SLEEPER_LEAGUE_ID environment variable is required");
  }
  if (!config.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  if (!config.tavilyApiKey) {
    console.warn(
      "Warning: TAVILY_API_KEY not set. Player research will be unavailable."
    );
  }
}
