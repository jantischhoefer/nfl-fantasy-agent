import { config, validateConfig } from "./config.js";
import { buildGraph } from "./agent/graph.js";

async function main() {
  console.log("🏈 NFL Fantasy Newsletter Agent\n");

  // Validate required env vars
  validateConfig();

  // Parse optional --week argument
  let week: number | null = null;
  const weekArg = process.argv.find((a) => a.startsWith("--week="));
  if (weekArg) {
    week = parseInt(weekArg.split("=")[1], 10);
    if (isNaN(week) || week < 1 || week > 18) {
      console.error("Invalid week. Must be between 1 and 18.");
      process.exit(1);
    }
    console.log(`Generating newsletter for Week ${week}\n`);
  } else {
    console.log(
      "No --week specified, will use the most recently completed week\n"
    );
  }

  const graph = buildGraph();

  const result = await graph.invoke({
    messages: [],
    leagueData: null,
    awards: null,
    newsletter: "",
    week,
  });

  console.log("\n✅ Done! Newsletter generated successfully.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
