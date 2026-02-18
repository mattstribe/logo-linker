"use client";

import { useState, useRef } from "react";
import { League, Conference, Division } from "@/lib/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t") {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function findColumnIndex(headers: string[], ...candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (idx >= 0) return idx;
  }
  return -1;
}

function buildLeagueFromCsv(text: string, leagueName: string): League | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headers = parseCsvLine(lines[0]);
  const confCol = findColumnIndex(headers, "Conference");
  const divCol = findColumnIndex(headers, "Abb", "Abbreviation", "DivAbb");
  const teamCol = findColumnIndex(headers, "FullTeamName", "Full Team Name");

  if (confCol < 0 || divCol < 0 || teamCol < 0) return null;

  const confMap = new Map<string, Map<string, string[]>>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const conf = cols[confCol]?.trim();
    const div = cols[divCol]?.trim();
    const team = cols[teamCol]?.trim();
    if (!conf || !div || !team) continue;

    if (!confMap.has(conf)) confMap.set(conf, new Map());
    const divMap = confMap.get(conf)!;
    if (!divMap.has(div)) divMap.set(div, []);
    if (!divMap.get(div)!.includes(team)) divMap.get(div)!.push(team);
  }

  if (confMap.size === 0) return null;

  const conferences: Conference[] = [];
  for (const [confName, divMap] of confMap) {
    const divisions: Division[] = [];
    for (const [divName, teams] of divMap) {
      divisions.push({
        id: generateId(),
        name: divName,
        teams: teams.map((t) => ({ id: generateId(), name: t })),
      });
    }
    conferences.push({ id: generateId(), name: confName, divisions });
  }

  return { name: leagueName, conferences };
}

interface Props {
  league: League;
  onChange: (league: League) => void;
  showNameError?: boolean;
}

export default function LeagueBuilder({ league, onChange, showNameError }: Props) {
  const [newConf, setNewConf] = useState("");
  const [newDivInputs, setNewDivInputs] = useState<Record<string, string>>({});
  const [newTeamInputs, setNewTeamInputs] = useState<Record<string, string>>(
    {}
  );
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateLeagueName(name: string) {
    onChange({ ...league, name });
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = buildLeagueFromCsv(text, league.name);
      if (!parsed) {
        setImportError(
          'Could not parse file. Make sure it has "Conference", "Abb", and "Full Team Name" columns.'
        );
        return;
      }
      onChange(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function addConference() {
    const name = newConf.trim();
    if (!name) return;
    const conf: Conference = {
      id: generateId(),
      name,
      divisions: [],
    };
    onChange({ ...league, conferences: [...league.conferences, conf] });
    setNewConf("");
  }

  function removeConference(confId: string) {
    onChange({
      ...league,
      conferences: league.conferences.filter((c) => c.id !== confId),
    });
  }

  function addDivision(confId: string) {
    const name = (newDivInputs[confId] || "").trim();
    if (!name) return;
    const div: Division = { id: generateId(), name, teams: [] };
    onChange({
      ...league,
      conferences: league.conferences.map((c) =>
        c.id === confId ? { ...c, divisions: [...c.divisions, div] } : c
      ),
    });
    setNewDivInputs((prev) => ({ ...prev, [confId]: "" }));
  }

  function removeDivision(confId: string, divId: string) {
    onChange({
      ...league,
      conferences: league.conferences.map((c) =>
        c.id === confId
          ? { ...c, divisions: c.divisions.filter((d) => d.id !== divId) }
          : c
      ),
    });
  }

  function addTeam(confId: string, divId: string) {
    const key = `${confId}-${divId}`;
    const name = (newTeamInputs[key] || "").trim();
    if (!name) return;
    const team = { id: generateId(), name };
    onChange({
      ...league,
      conferences: league.conferences.map((c) =>
        c.id === confId
          ? {
              ...c,
              divisions: c.divisions.map((d) =>
                d.id === divId ? { ...d, teams: [...d.teams, team] } : d
              ),
            }
          : c
      ),
    });
    setNewTeamInputs((prev) => ({ ...prev, [key]: "" }));
  }

  function removeTeam(confId: string, divId: string, teamId: string) {
    onChange({
      ...league,
      conferences: league.conferences.map((c) =>
        c.id === confId
          ? {
              ...c,
              divisions: c.divisions.map((d) =>
                d.id === divId
                  ? { ...d, teams: d.teams.filter((t) => t.id !== teamId) }
                  : d
              ),
            }
          : c
      ),
    });
  }

  const totalTeams = league.conferences.reduce(
    (sum, c) => sum + c.divisions.reduce((s, d) => s + d.teams.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* League name */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          League Name
        </label>
        <input
          type="text"
          value={league.name}
          onChange={(e) => updateLeagueName(e.target.value)}
          placeholder="e.g. NFL, NBA, Premier League..."
          className={`w-full rounded-lg border bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
            showNameError
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-zinc-700 focus:border-blue-500 focus:ring-blue-500"
          }`}
        />
      </div>

      {/* Import from CSV */}
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-zinc-400">
            Import from Spreadsheet
          </label>
          {league.conferences.length > 0 && (
            <span className="text-[10px] text-yellow-500/70">
              Importing will replace current structure
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600 mb-3">
          Upload a CSV or TSV with <strong className="text-zinc-400">Conference</strong>,{" "}
          <strong className="text-zinc-400">Abb</strong> (division name), and{" "}
          <strong className="text-zinc-400">Full Team Name</strong> columns.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload CSV / TSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          onChange={handleFileImport}
          className="hidden"
        />
        {importError && (
          <p className="mt-2 text-xs text-red-400">{importError}</p>
        )}
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 border-t border-zinc-800" />
        <span className="text-xs text-zinc-600">or build manually</span>
        <div className="flex-1 border-t border-zinc-800" />
      </div>

      {/* Add conference */}
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-1">
          Add Conference
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newConf}
            onChange={(e) => setNewConf(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addConference()}
            placeholder="e.g. Eastern, Western, AFC..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={addConference}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Conference tree */}
      {league.conferences.length > 0 && (
        <div className="space-y-4">
          {league.conferences.map((conf) => (
            <div
              key={conf.id}
              className="rounded-xl border border-zinc-700 bg-zinc-800/50 overflow-hidden"
            >
              {/* Conference header */}
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
                <h3 className="font-semibold text-white">{conf.name}</h3>
                <button
                  onClick={() => removeConference(conf.id)}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Add division */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDivInputs[conf.id] || ""}
                    onChange={(e) =>
                      setNewDivInputs((prev) => ({
                        ...prev,
                        [conf.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && addDivision(conf.id)
                    }
                    placeholder="Add division..."
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => addDivision(conf.id)}
                    className="rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Divisions */}
                {conf.divisions.map((div) => (
                  <div
                    key={div.id}
                    className="rounded-lg border border-zinc-700 bg-zinc-900/50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900">
                      <h4 className="text-sm font-medium text-zinc-300">
                        {div.name}
                      </h4>
                      <button
                        onClick={() => removeDivision(conf.id, div.id)}
                        className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="p-3 space-y-2">
                      {/* Teams list */}
                      {div.teams.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {div.teams.map((team) => (
                            <span
                              key={team.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300"
                            >
                              {team.name}
                              <button
                                onClick={() =>
                                  removeTeam(conf.id, div.id, team.id)
                                }
                                className="text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add team */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={
                            newTeamInputs[`${conf.id}-${div.id}`] || ""
                          }
                          onChange={(e) =>
                            setNewTeamInputs((prev) => ({
                              ...prev,
                              [`${conf.id}-${div.id}`]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            addTeam(conf.id, div.id)
                          }
                          placeholder="Add team..."
                          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => addTeam(conf.id, div.id)}
                          className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-white hover:bg-zinc-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {totalTeams > 0 && (
        <p className="text-sm text-zinc-500">
          {league.conferences.length} conference
          {league.conferences.length !== 1 && "s"},{" "}
          {league.conferences.reduce((s, c) => s + c.divisions.length, 0)}{" "}
          division
          {league.conferences.reduce((s, c) => s + c.divisions.length, 0) !== 1 && "s"},{" "}
          {totalTeams} team{totalTeams !== 1 && "s"}
        </p>
      )}
    </div>
  );
}
