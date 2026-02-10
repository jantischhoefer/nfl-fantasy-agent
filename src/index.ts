import { config, validateConfig } from "./config.js";
import { buildGraph } from "./agent/graph.js";
import { generateMockLeagueData } from "./simulation/index.js";

function parseArgs() {
  const args = process.argv.slice(2);

  let week: number | null = null;
  let simulate = false;

  for (const arg of args) {
    if (arg.startsWith("--week=")) {
      week = parseInt(arg.split("=")[1], 10);
      if (isNaN(week) || week < 1 || week > 18) {
        console.error("Invalid week. Must be between 1 and 18.");
        process.exit(1);
      }
    } else if (arg === "--simulate") {
      simulate = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: nfl-fantasy-agent [options]

Options:
  --week=N       Generate newsletter for week N (1-18)
  --simulate     Use simulated league data (no API keys needed)
  --help, -h     Show this help message

Examples:
  npm run generate                        # Latest completed week (live data)
  npm run generate -- --simulate          # Simulated data, week 5
  npm run generate -- --simulate --week=3 # Simulated data, week 3
`);
      process.exit(0);
    }
  }

  return { week, simulate };
}

async function main() {
  console.log("🏈 NFL Fantasy Newsletter Agent\n");

  const { week, simulate } = parseArgs();

  if (simulate) {
    const simWeek = week ?? 5;
    console.log(`🎮 SIMULATION MODE — generating mock data for Week ${simWeek}\n`);

    // Only Anthropic API key is required in simulation mode
    if (!config.anthropicApiKey) {
      console.error("ANTHROPIC_API_KEY is required even in simulation mode.");
      process.exit(1);
    }

    const mockData = generateMockLeagueData(simWeek);

    const graph = buildGraph();
    await graph.invoke({
      messages: [],
      leagueData: mockData,
      awards: null,
      newsletter: "",
      week: simWeek,
    });
  } else {
    // Live mode — validate all config
    validateConfig();

    if (week) {
      console.log(`Generating newsletter for Week ${week}\n`);
    } else {
      console.log(
        "No --week specified, will use the most recently completed week\n"
      );
    }

    const graph = buildGraph();
    await graph.invoke({
      messages: [],
      leagueData: null,
      awards: null,
      newsletter: "",
      week,
    });
  }

  console.log("\n✅ Done! Newsletter generated successfully.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
