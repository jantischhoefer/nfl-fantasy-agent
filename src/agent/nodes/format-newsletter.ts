import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../../config.js";
import type { AgentStateType } from "../state.js";

/**
 * Graph node: Extracts the final newsletter from the agent's last message,
 * prints it to console, and saves it to a file.
 */
export async function formatNewsletterNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  // The last AI message should contain the newsletter
  const messages = state.messages;
  let newsletter = "";

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (
      msg._getType() === "ai" &&
      typeof msg.content === "string" &&
      msg.content.length > 100
    ) {
      newsletter = msg.content;
      break;
    }
  }

  if (!newsletter) {
    console.error("⚠️ Could not find newsletter content in agent messages.");
    return { newsletter: "Newsletter generation failed." };
  }

  // Print to console
  console.log("\n" + "=".repeat(60));
  console.log("📰 FANTASY FOOTBALL NEWSLETTER");
  console.log("=".repeat(60) + "\n");
  console.log(newsletter);
  console.log("\n" + "=".repeat(60) + "\n");

  // Save to file
  const week = state.week ?? 0;
  const season = state.leagueData?.season ?? "unknown";
  await mkdir(config.outputDir, { recursive: true });
  const filename = `newsletter-${season}-week-${week}.txt`;
  const filepath = join(config.outputDir, filename);
  await writeFile(filepath, newsletter, "utf-8");
  console.log(`💾 Newsletter saved to ${filepath}`);

  return { newsletter };
}
