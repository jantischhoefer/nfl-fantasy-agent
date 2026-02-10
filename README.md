# NFL Fantasy Newsletter Agent

A LangGraph.js agent that generates entertaining weekly fantasy football newsletters for your Sleeper league. It fetches league data, computes weekly awards, optionally researches player news, and uses Claude to write a newsletter in the style of a witty fantasy football journalist.

## Features

- **Automated Data Collection** — Pulls matchups, rosters, transactions, and standings from the Sleeper API
- **Weekly Awards** — Computes: Point Leader, Worst Performance, Best Bench Player, Best Waiver Pickup, Closest Matchup, Biggest Blowout
- **AI-Powered Writing** — Claude generates a newsletter with personality, trash talk, and real analysis
- **Player Research** — Optionally searches the web (via Tavily) for context on notable players
- **Cached Player Data** — The ~5MB Sleeper player database is cached locally and refreshed once per day

## Prerequisites

- Node.js >= 20
- A [Sleeper](https://sleeper.com) fantasy football league
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
SLEEPER_LEAGUE_ID=123456789     # your Sleeper league ID
```

**Finding your Sleeper League ID:** Open your league in the Sleeper app or website. The league ID is in the URL: `https://sleeper.com/leagues/LEAGUE_ID/...`

## Usage

```bash
# Generate newsletter for the most recently completed week
npm run generate

# Generate newsletter for a specific week
npm run generate -- --week=5

# Or using tsx directly
npx tsx --env-file=.env src/index.ts --week=5
```

## How It Works

```
┌─────────────┐     ┌────────────────┐     ┌─────────────────┐
│ collectData  │────▶│ computeAwards  │────▶│   Agent (Claude) │
│ (Sleeper API)│     │ (pure logic)   │     │ + researchPlayer │
└─────────────┘     └────────────────┘     └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │ formatNewsletter │
                                            │ (console + file) │
                                            └─────────────────┘
```

1. **collectData** — Fetches NFL state, league info, rosters, matchups, transactions, and the player name database from the Sleeper API
2. **computeAwards** — Crunches the numbers to find the weekly award winners
3. **Agent** — Claude receives all the data + awards and writes the newsletter. It can optionally call the `researchPlayer` tool to look up recent news about notable players.
4. **formatNewsletter** — Prints the newsletter and saves it to `output/newsletter-{season}-week-{week}.txt`

## Project Structure

```
src/
  index.ts                    # CLI entry point
  config.ts                   # Environment config
  agent/
    graph.ts                  # LangGraph StateGraph definition
    state.ts                  # Graph state (Annotation)
    nodes/
      collect-data.ts         # Sleeper data fetching node
      compute-awards.ts       # Awards computation logic
      format-newsletter.ts    # Output formatting node
  tools/
    research.ts               # Tavily web search tool
  services/
    sleeper-client.ts         # Sleeper API HTTP client (with retry)
    player-cache.ts           # Player ID → name cache
  types/
    sleeper.ts                # TypeScript interfaces for Sleeper API
  prompts/
    journalist.ts             # System prompt for the journalist persona
```

## License

MIT
