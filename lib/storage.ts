import { League } from "./types";

const LEAGUE_KEY = "logo-linker-league";

export function saveLeague(league: League): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LEAGUE_KEY, JSON.stringify(league));
}

export function loadLeague(): League | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LEAGUE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as League;
  } catch {
    return null;
  }
}

export function clearLeague(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEAGUE_KEY);
}
