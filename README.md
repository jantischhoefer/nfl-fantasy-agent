# NFL Fantasy Newsletter Agent

A LangGraph.js agent that generates entertaining weekly fantasy football newsletters for your Sleeper league. It fetches league data, computes weekly awards, optionally researches player news, and uses Claude to write a newsletter in the style of a witty fantasy football journalist.

## Features

- **Automated Data Collection** — Pulls matchups, rosters, transactions, and standings from the Sleeper API
- **Weekly Awards** — Computes: Point Leader, Worst Performance, Best Bench Player, Best Waiver Pickup, Closest Matchup, Biggest Blowout
- **AI-Powered Writing** — Claude generates a newsletter with personality, trash talk, and real analysis
- **Player Research** — Optionally searches the web (via Tavily) for context on notable players
- **Simulation Mode** — Generate newsletters with mock data when no real league data is available
- **Cached Player Data** — The ~5MB Sleeper player database is cached locally and refreshed once per day

## Prerequisites

- Node.js >= 20
- A [Sleeper](https://sleeper.com) fantasy football league (or use `--simulate`)
- An [Anthropic API key](https://console.anthropic.com/) for Claude
- (Optional) A [Tavily API key](https://tavily.com/) for player research

## Setup

```bash
# Install dependencies
npm install

# Copy and fill in your environment variables
cp .env.example .env
```

Edit `.env` with your values:

```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...         # optional, enables player research
SLEEPER_LEAGUE_ID=123456789     # your Sleeper league ID (not needed for --simulate)
```

**Finding your Sleeper League ID:** Open your league in the Sleeper app or website. The league ID is in the URL: `https://sleeper.com/leagues/LEAGUE_ID/...`

## Usage

```bash
# Generate newsletter for the most recently completed week (live Sleeper data)
npm run generate

# Generate newsletter for a specific week
npm run generate -- --week=5

# Simulation mode — uses mock league data, only needs ANTHROPIC_API_KEY
npm run generate -- --simulate
npm run generate -- --simulate --week=3
```

### Simulation Mode

When the NFL season hasn't started yet or you want to test without a real league, use `--simulate` to generate a mock 10-team league with:

- 10 fantasy teams with creative names and managers
- Full rosters drafted from ~112 real NFL players
- Realistic weekly scoring with boom/bust variance
- Simulated waiver wire transactions
- Deterministic output (same week always produces same data, different weeks differ)

Only `ANTHROPIC_API_KEY` is required in simulation mode.

## Testing

Tests are written with [Vitest](https://vitest.dev/) — a fast, TypeScript-native test runner.

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

Current test coverage:
- **Simulation module** — Validates mock data structure, roster integrity, matchup consistency, determinism
- **Awards computation** — Verifies all 6 award categories, standings sorting, matchup results across multiple weeks

## How It Works

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ collectData  │────▶│ computeAwards  │────▶│   Agent (Claude)  │
│ (Sleeper API)│     │ (pure logic)   │     │ + researchPlayer  │
└──────────────┘     └────────────────┘     └────────┬─────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │ formatNewsletter  │
                                            │ (console + file)  │
                                            └──────────────────┘
```

1. **collectData** — Fetches NFL state, league info, rosters, matchups, transactions, and the player name database from the Sleeper API (or uses injected mock data in simulation mode)
2. **computeAwards** — Crunches the numbers to find the weekly award winners
3. **Agent** — Claude receives all the data + awards and writes the newsletter. It can optionally call the `researchPlayer` tool to look up recent news about notable players.
4. **formatNewsletter** — Prints the newsletter and saves it to `output/newsletter-{season}-week-{week}.txt`

## Project Structure

```
src/
  index.ts                    # CLI entry point (--simulate, --week=N)
  config.ts                   # Environment config
  agent/
    graph.ts                  # LangGraph StateGraph definition
    state.ts                  # Graph state (Annotation)
    nodes/
      collect-data.ts         # Sleeper data fetching node
      compute-awards.ts       # Awards computation logic + tests
      format-newsletter.ts    # Output formatting node
  tools/
    research.ts               # Tavily web search tool
  services/
    sleeper-client.ts         # Sleeper API HTTP client (with retry)
    player-cache.ts           # Player ID → name cache
  simulation/
    mock-data.ts              # Generates a full mock league + tests
    players.ts                # ~112 real NFL player seeds
    index.ts                  # Module exports
  types/
    sleeper.ts                # TypeScript interfaces for Sleeper API
  prompts/
    journalist.ts             # System prompt for the journalist persona
```

## License

MIT
