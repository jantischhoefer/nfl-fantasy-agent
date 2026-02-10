/** NFL state returned by GET /state/nfl */
export interface NflState {
  week: number;
  season_type: "pre" | "regular" | "post";
  season_start_date: string;
  season: string;
  previous_season: string;
  leg: number;
  league_season: string;
  league_create_season: string;
  display_week: number;
}

/** League metadata returned by GET /league/{league_id} */
export interface League {
  total_rosters: number;
  status: "pre_draft" | "drafting" | "in_season" | "complete";
  sport: string;
  settings: Record<string, number>;
  season_type: string;
  season: string;
  scoring_settings: Record<string, number>;
  roster_positions: string[];
  previous_league_id: string | null;
  name: string;
  league_id: string;
  draft_id: string;
  avatar: string | null;
}

/** A user/manager in a league returned by GET /league/{league_id}/users */
export interface LeagueUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  metadata: {
    team_name?: string;
    [key: string]: unknown;
  };
  is_owner: boolean;
}

/** Roster settings containing W/L/T and points */
export interface RosterSettings {
  wins: number;
  waiver_position: number;
  waiver_budget_used: number;
  total_moves: number;
  ties: number;
  losses: number;
  fpts_decimal?: number;
  fpts_against_decimal?: number;
  fpts_against?: number;
  fpts?: number;
  [key: string]: number | undefined;
}

/** A roster in a league returned by GET /league/{league_id}/rosters */
export interface Roster {
  starters: string[];
  settings: RosterSettings;
  roster_id: number;
  reserve: string[] | null;
  players: string[];
  player_map?: Record<string, string | null>;
  owner_id: string;
  league_id: string;
}

/** A single team's matchup entry for a given week */
export interface Matchup {
  starters: string[];
  roster_id: number;
  players: string[];
  matchup_id: number;
  points: number;
  custom_points: number | null;
  /** Per-player point breakdown: player_id -> points */
  players_points: Record<string, number>;
  starters_points?: number[];
}

/** A transaction (trade, waiver, free_agent) */
export interface Transaction {
  type: "trade" | "free_agent" | "waiver";
  transaction_id: string;
  status_updated: number;
  status: "complete" | "failed";
  settings: { waiver_bid?: number } | null;
  roster_ids: number[];
  metadata: Record<string, string> | null;
  leg: number;
  drops: Record<string, number> | null;
  draft_picks: TransactionDraftPick[];
  creator: string;
  created: number;
  consenter_ids: number[];
  adds: Record<string, number> | null;
  waiver_budget: WaiverBudgetTransfer[];
}

export interface TransactionDraftPick {
  season: string;
  round: number;
  roster_id: number;
  previous_owner_id: number;
  owner_id: number;
}

export interface WaiverBudgetTransfer {
  sender: number;
  receiver: number;
  amount: number;
}

/** A single player entry from GET /players/nfl (trimmed to useful fields) */
export interface Player {
  player_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  position: string | null;
  team: string | null;
  fantasy_positions: string[] | null;
  status: string | null;
  injury_status: string | null;
  number: number | null;
  age: number | null;
  college: string | null;
  years_exp: number | null;
  search_full_name: string | null;
}

/** Simplified player map: player_id -> display info */
export type PlayerMap = Record<string, Player>;

/** All collected league data for a given week */
export interface WeeklyLeagueData {
  nflState: NflState;
  league: League;
  users: LeagueUser[];
  rosters: Roster[];
  matchups: Matchup[];
  transactions: Transaction[];
  playerMap: PlayerMap;
  week: number;
  season: string;
}
