import type { Player } from "../types/sleeper.js";

/**
 * A curated set of ~120 real NFL players used for simulation.
 * Player IDs are synthetic but the names/teams/positions are realistic
 * for a 2025-era fantasy league.
 */

interface PlayerSeed {
  id: string;
  first: string;
  last: string;
  pos: string;
  team: string;
}

const PLAYER_SEEDS: PlayerSeed[] = [
  // ── Quarterbacks (20) ─────────────────────────────────────────────────
  { id: "p_qb01", first: "Josh", last: "Allen", pos: "QB", team: "BUF" },
  { id: "p_qb02", first: "Patrick", last: "Mahomes", pos: "QB", team: "KC" },
  { id: "p_qb03", first: "Lamar", last: "Jackson", pos: "QB", team: "BAL" },
  { id: "p_qb04", first: "Jalen", last: "Hurts", pos: "QB", team: "PHI" },
  { id: "p_qb05", first: "Joe", last: "Burrow", pos: "QB", team: "CIN" },
  { id: "p_qb06", first: "Jayden", last: "Daniels", pos: "QB", team: "WAS" },
  { id: "p_qb07", first: "C.J.", last: "Stroud", pos: "QB", team: "HOU" },
  { id: "p_qb08", first: "Dak", last: "Prescott", pos: "QB", team: "DAL" },
  { id: "p_qb09", first: "Jared", last: "Goff", pos: "QB", team: "DET" },
  { id: "p_qb10", first: "Baker", last: "Mayfield", pos: "QB", team: "TB" },
  { id: "p_qb11", first: "Kyler", last: "Murray", pos: "QB", team: "ARI" },
  { id: "p_qb12", first: "Caleb", last: "Williams", pos: "QB", team: "CHI" },
  { id: "p_qb13", first: "Jordan", last: "Love", pos: "QB", team: "GB" },
  { id: "p_qb14", first: "Tua", last: "Tagovailoa", pos: "QB", team: "MIA" },
  { id: "p_qb15", first: "Anthony", last: "Richardson", pos: "QB", team: "IND" },
  { id: "p_qb16", first: "Sam", last: "Darnold", pos: "QB", team: "SEA" },
  { id: "p_qb17", first: "Matthew", last: "Stafford", pos: "QB", team: "LAR" },
  { id: "p_qb18", first: "Brock", last: "Purdy", pos: "QB", team: "SF" },
  { id: "p_qb19", first: "Justin", last: "Herbert", pos: "QB", team: "LAC" },
  { id: "p_qb20", first: "Trevor", last: "Lawrence", pos: "QB", team: "JAX" },

  // ── Running Backs (30) ────────────────────────────────────────────────
  { id: "p_rb01", first: "Saquon", last: "Barkley", pos: "RB", team: "PHI" },
  { id: "p_rb02", first: "Derrick", last: "Henry", pos: "RB", team: "BAL" },
  { id: "p_rb03", first: "Bijan", last: "Robinson", pos: "RB", team: "ATL" },
  { id: "p_rb04", first: "Jahmyr", last: "Gibbs", pos: "RB", team: "DET" },
  { id: "p_rb05", first: "Christian", last: "McCaffrey", pos: "RB", team: "SF" },
  { id: "p_rb06", first: "Breece", last: "Hall", pos: "RB", team: "NYJ" },
  { id: "p_rb07", first: "Josh", last: "Jacobs", pos: "RB", team: "GB" },
  { id: "p_rb08", first: "De'Von", last: "Achane", pos: "RB", team: "MIA" },
  { id: "p_rb09", first: "Jonathan", last: "Taylor", pos: "RB", team: "IND" },
  { id: "p_rb10", first: "Kenneth", last: "Walker III", pos: "RB", team: "SF" },
  { id: "p_rb11", first: "James", last: "Cook", pos: "RB", team: "BUF" },
  { id: "p_rb12", first: "Kyren", last: "Williams", pos: "RB", team: "LAR" },
  { id: "p_rb13", first: "Alvin", last: "Kamara", pos: "RB", team: "NO" },
  { id: "p_rb14", first: "Isiah", last: "Pacheco", pos: "RB", team: "KC" },
  { id: "p_rb15", first: "Joe", last: "Mixon", pos: "RB", team: "HOU" },
  { id: "p_rb16", first: "David", last: "Montgomery", pos: "RB", team: "DET" },
  { id: "p_rb17", first: "Aaron", last: "Jones", pos: "RB", team: "MIN" },
  { id: "p_rb18", first: "Tony", last: "Pollard", pos: "RB", team: "TEN" },
  { id: "p_rb19", first: "Rhamondre", last: "Stevenson", pos: "RB", team: "NE" },
  { id: "p_rb20", first: "Travis", last: "Etienne", pos: "RB", team: "JAX" },
  { id: "p_rb21", first: "Chuba", last: "Hubbard", pos: "RB", team: "CAR" },
  { id: "p_rb22", first: "Najee", last: "Harris", pos: "RB", team: "LAC" },
  { id: "p_rb23", first: "Rico", last: "Dowdle", pos: "RB", team: "CAR" },
  { id: "p_rb24", first: "Chase", last: "Brown", pos: "RB", team: "CIN" },
  { id: "p_rb25", first: "Zack", last: "Moss", pos: "RB", team: "CIN" },
  { id: "p_rb26", first: "Rachaad", last: "White", pos: "RB", team: "TB" },
  { id: "p_rb27", first: "Jerome", last: "Ford", pos: "RB", team: "CLE" },
  { id: "p_rb28", first: "D'Andre", last: "Swift", pos: "RB", team: "CHI" },
  { id: "p_rb29", first: "Javonte", last: "Williams", pos: "RB", team: "DEN" },
  { id: "p_rb30", first: "Zamir", last: "White", pos: "RB", team: "LV" },

  // ── Wide Receivers (30) ───────────────────────────────────────────────
  { id: "p_wr01", first: "Ja'Marr", last: "Chase", pos: "WR", team: "CIN" },
  { id: "p_wr02", first: "CeeDee", last: "Lamb", pos: "WR", team: "DAL" },
  { id: "p_wr03", first: "Amon-Ra", last: "St. Brown", pos: "WR", team: "DET" },
  { id: "p_wr04", first: "Tyreek", last: "Hill", pos: "WR", team: "MIA" },
  { id: "p_wr05", first: "A.J.", last: "Brown", pos: "WR", team: "PHI" },
  { id: "p_wr06", first: "Malik", last: "Nabers", pos: "WR", team: "NYG" },
  { id: "p_wr07", first: "Nico", last: "Collins", pos: "WR", team: "HOU" },
  { id: "p_wr08", first: "Puka", last: "Nacua", pos: "WR", team: "LAR" },
  { id: "p_wr09", first: "Justin", last: "Jefferson", pos: "WR", team: "MIN" },
  { id: "p_wr10", first: "Davante", last: "Adams", pos: "WR", team: "LAR" },
  { id: "p_wr11", first: "Drake", last: "London", pos: "WR", team: "ATL" },
  { id: "p_wr12", first: "Garrett", last: "Wilson", pos: "WR", team: "NYJ" },
  { id: "p_wr13", first: "DK", last: "Metcalf", pos: "WR", team: "PIT" },
  { id: "p_wr14", first: "Terry", last: "McLaurin", pos: "WR", team: "WAS" },
  { id: "p_wr15", first: "Mike", last: "Evans", pos: "WR", team: "TB" },
  { id: "p_wr16", first: "Chris", last: "Olave", pos: "WR", team: "NO" },
  { id: "p_wr17", first: "Stefon", last: "Diggs", pos: "WR", team: "HOU" },
  { id: "p_wr18", first: "DeVonta", last: "Smith", pos: "WR", team: "PHI" },
  { id: "p_wr19", first: "Brandon", last: "Aiyuk", pos: "WR", team: "SF" },
  { id: "p_wr20", first: "Jaylen", last: "Waddle", pos: "WR", team: "MIA" },
  { id: "p_wr21", first: "Tee", last: "Higgins", pos: "WR", team: "CIN" },
  { id: "p_wr22", first: "Cooper", last: "Kupp", pos: "WR", team: "LAR" },
  { id: "p_wr23", first: "Zay", last: "Flowers", pos: "WR", team: "BAL" },
  { id: "p_wr24", first: "Rashod", last: "Bateman", pos: "WR", team: "BAL" },
  { id: "p_wr25", first: "Jaxon", last: "Smith-Njigba", pos: "WR", team: "SEA" },
  { id: "p_wr26", first: "George", last: "Pickens", pos: "WR", team: "DAL" },
  { id: "p_wr27", first: "Ladd", last: "McConkey", pos: "WR", team: "LAC" },
  { id: "p_wr28", first: "Rome", last: "Odunze", pos: "WR", team: "CHI" },
  { id: "p_wr29", first: "Khalil", last: "Shakir", pos: "WR", team: "BUF" },
  { id: "p_wr30", first: "Keenan", last: "Allen", pos: "WR", team: "LAC" },

  // ── Tight Ends (12) ──────────────────────────────────────────────────
  { id: "p_te01", first: "Sam", last: "LaPorta", pos: "TE", team: "DET" },
  { id: "p_te02", first: "Travis", last: "Kelce", pos: "TE", team: "KC" },
  { id: "p_te03", first: "Trey", last: "McBride", pos: "TE", team: "ARI" },
  { id: "p_te04", first: "George", last: "Kittle", pos: "TE", team: "SF" },
  { id: "p_te05", first: "Mark", last: "Andrews", pos: "TE", team: "BAL" },
  { id: "p_te06", first: "Brock", last: "Bowers", pos: "TE", team: "LV" },
  { id: "p_te07", first: "Dallas", last: "Goedert", pos: "TE", team: "PHI" },
  { id: "p_te08", first: "Evan", last: "Engram", pos: "TE", team: "JAX" },
  { id: "p_te09", first: "David", last: "Njoku", pos: "TE", team: "CLE" },
  { id: "p_te10", first: "Kyle", last: "Pitts", pos: "TE", team: "ATL" },
  { id: "p_te11", first: "T.J.", last: "Hockenson", pos: "TE", team: "MIN" },
  { id: "p_te12", first: "Dalton", last: "Kincaid", pos: "TE", team: "BUF" },

  // ── Kickers (10) ─────────────────────────────────────────────────────
  { id: "p_k01", first: "Harrison", last: "Butker", pos: "K", team: "KC" },
  { id: "p_k02", first: "Justin", last: "Tucker", pos: "K", team: "BAL" },
  { id: "p_k03", first: "Jake", last: "Moody", pos: "K", team: "SF" },
  { id: "p_k04", first: "Brandon", last: "Aubrey", pos: "K", team: "DAL" },
  { id: "p_k05", first: "Cameron", last: "Dicker", pos: "K", team: "LAC" },
  { id: "p_k06", first: "Ka'imi", last: "Fairbairn", pos: "K", team: "HOU" },
  { id: "p_k07", first: "Tyler", last: "Bass", pos: "K", team: "BUF" },
  { id: "p_k08", first: "Younghoe", last: "Koo", pos: "K", team: "ATL" },
  { id: "p_k09", first: "Jason", last: "Sanders", pos: "K", team: "MIA" },
  { id: "p_k10", first: "Jake", last: "Elliott", pos: "K", team: "PHI" },
];

// Defense IDs are team abbreviations
const DEFENSE_TEAMS = [
  "SF", "DAL", "BAL", "CLE", "NYJ", "BUF", "MIA", "PIT", "DET", "KC",
];

export function buildPlayerMap(): Record<string, Player> {
  const map: Record<string, Player> = {};

  for (const seed of PLAYER_SEEDS) {
    map[seed.id] = {
      player_id: seed.id,
      first_name: seed.first,
      last_name: seed.last,
      full_name: `${seed.first} ${seed.last}`,
      position: seed.pos,
      team: seed.team,
      fantasy_positions: [seed.pos],
      status: "Active",
      injury_status: null,
      number: null,
      age: null,
      college: null,
      years_exp: null,
      search_full_name: `${seed.first}${seed.last}`.toLowerCase().replace(/[^a-z]/g, ""),
    };
  }

  // Add defense "players"
  for (const team of DEFENSE_TEAMS) {
    map[team] = {
      player_id: team,
      first_name: team,
      last_name: "D/ST",
      full_name: `${team} D/ST`,
      position: "DEF",
      team,
      fantasy_positions: ["DEF"],
      status: "Active",
      injury_status: null,
      number: null,
      age: null,
      college: null,
      years_exp: null,
      search_full_name: team.toLowerCase(),
    };
  }

  return map;
}

export function getPlayerSeeds(): PlayerSeed[] {
  return PLAYER_SEEDS;
}

export function getDefenseTeams(): string[] {
  return DEFENSE_TEAMS;
}
