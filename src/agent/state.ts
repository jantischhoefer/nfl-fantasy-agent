import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { WeeklyLeagueData } from "../types/sleeper.js";
import type { WeeklyAwards } from "./nodes/compute-awards.js";

/**
 * The shared state flowing through the LangGraph StateGraph.
 *
 * Each node reads/writes specific fields. The `messages` field uses
 * LangGraph's built-in reducer to accumulate chat messages for the
 * tool-calling agent loop.
 */
export const AgentState = Annotation.Root({
  /** Chat messages for the Claude agent (system + assistant + tool calls) */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),

  /** Raw league data fetched from Sleeper (set by collectData node) */
  leagueData: Annotation<WeeklyLeagueData | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Computed awards (set by computeAwards node) */
  awards: Annotation<WeeklyAwards | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** The final newsletter text (set by formatNewsletter node) */
  newsletter: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),

  /** Target week to generate the newsletter for */
  week: Annotation<number | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

export type AgentStateType = typeof AgentState.State;
