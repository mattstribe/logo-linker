"use client";

import { useState } from "react";
import { League, Conference, Division } from "@/lib/types";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  league: League;
  onChange: (league: League) => void;
}

export default function LeagueBuilder({ league, onChange }: Props) {
  const [newConf, setNewConf] = useState("");
  const [newDivInputs, setNewDivInputs] = useState<Record<string, string>>({});
  const [newTeamInputs, setNewTeamInputs] = useState<Record<string, string>>(
    {}
  );

  function updateLeagueName(name: string) {
    onChange({ ...league, name });
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
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
