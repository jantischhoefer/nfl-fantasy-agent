import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { AIMessage } from "@langchain/core/messages";

import { AgentState } from "./state.js";
import type { AgentStateType } from "./state.js";
import { collectDataNode } from "./nodes/collect-data.js";
import {
  computeAwards,
  formatAwardsSummary,
} from "./nodes/compute-awards.js";
import { formatNewsletterNode } from "./nodes/format-newsletter.js";
import { researchPlayerTool } from "../tools/research.js";
import { JOURNALIST_SYSTEM_PROMPT } from "../prompts/journalist.js";
import { config } from "../config.js";

// ─── Tools ──────────────────────────────────────────────────────────────────

const tools = [researchPlayerTool];
const toolNode = new ToolNode(tools);

// ─── LLM ────────────────────────────────────────────────────────────────────

function createModel() {
  return new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    apiKey: config.anthropicApiKey,
  }).bindTools(tools);
}

// ─── Node: Compute awards and inject data into messages ─────────────────────

async function computeAwardsNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const data = state.leagueData;
  if (!data) {
    throw new Error("No league data available — collectData must run first");
  }

  console.log("🏅 Computing weekly awards...");
  const awards = computeAwards(
    data.matchups,
    data.transactions,
    data.users,
    data.rosters,
    data.playerMap
  );

  const summary = formatAwardsSummary(awards);
  console.log("✅ Awards computed\n");

  // Build the initial messages for the agent:
  // 1. System prompt (journalist persona)
  // 2. Human message with all the data + awards
  const dataMessage = `Here is the fantasy football data for ${data.league.name}, ${data.season} Season, Week ${data.week}:

${summary}

LEAGUE NAME: ${data.league.name}
SEASON: ${data.season}
WEEK: ${data.week}

Please write the weekly newsletter now. You may use the researchPlayer tool to look up context on 1-3 notable players if it would add value to the newsletter. Don't research every player — focus on the most interesting storylines (the point leader's star player, a surprising bench performance, or a player involved in a notable waiver pickup).`;

  return {
    awards,
    messages: [
      new SystemMessage(JOURNALIST_SYSTEM_PROMPT),
      new HumanMessage(dataMessage),
    ],
  };
}

// ─── Node: Call the agent (Claude) ──────────────────────────────────────────

async function agentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  console.log("🤖 Calling Claude to generate newsletter...");
  const model = createModel();
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

// ─── Conditional edge: should we call tools or finish? ──────────────────────

function shouldContinue(state: AgentStateType): "tools" | "format" {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if the last message has tool calls
  if (
    lastMessage._getType() === "ai" &&
    (lastMessage as AIMessage).tool_calls &&
    (lastMessage as AIMessage).tool_calls!.length > 0
  ) {
    console.log("🔧 Agent wants to use tools...");
    return "tools";
  }

  return "format";
}

// ─── Build the graph ────────────────────────────────────────────────────────

export function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("collectData", collectDataNode)
    .addNode("computeAwards", computeAwardsNode)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addNode("formatNewsletter", formatNewsletterNode)

    // Flow: collect -> awards -> agent -> (tools loop or format)
    .addEdge("__start__", "collectData")
    .addEdge("collectData", "computeAwards")
    .addEdge("computeAwards", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      format: "formatNewsletter",
    })
    .addEdge("tools", "agent")
    .addEdge("formatNewsletter", "__end__");

  return graph.compile();
}
