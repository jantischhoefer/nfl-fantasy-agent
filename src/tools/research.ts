import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { config } from "../config.js";

/**
 * A LangGraph-compatible tool that searches the web for fantasy football
 * news about a specific player using the Tavily search API.
 */
export const researchPlayerTool = tool(
  async ({ playerName, context }) => {
    if (!config.tavilyApiKey) {
      return `Web search unavailable (no TAVILY_API_KEY configured). Proceed without external research for ${playerName}.`;
    }

    try {
      const client = tavily({ apiKey: config.tavilyApiKey });
      const query = `${playerName} NFL fantasy football ${context ?? "news"} 2025`;

      const result = await client.search(query, {
        maxResults: 3,
        searchDepth: "basic",
        includeAnswer: true,
      });

      if (result.answer) {
        return `Research on ${playerName}:\n${result.answer}\n\nSources:\n${result.results.map((r) => `- ${r.title}: ${r.url}`).join("\n")}`;
      }

      if (result.results.length === 0) {
        return `No recent news found for ${playerName}.`;
      }

      return `Research on ${playerName}:\n${result.results.map((r) => `- ${r.title}: ${r.content?.slice(0, 200) ?? ""}`).join("\n\n")}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return `Failed to research ${playerName}: ${msg}. Proceed without this research.`;
    }
  },
  {
    name: "researchPlayer",
    description:
      "Search the web for recent NFL fantasy football news, injury updates, or performance analysis about a specific player. Use this to add context to the newsletter about notable performers or trending players.",
    schema: z.object({
      playerName: z
        .string()
        .describe("Full name of the NFL player to research"),
      context: z
        .string()
        .optional()
        .describe(
          'Optional context for the search, e.g. "injury update", "trade rumors", "week 5 performance"'
        ),
    }),
  }
);
