"use client";

import { useState } from "react";
import { League, UploadedLogo, Assignments } from "@/lib/types";
import LogoThumbnail from "./LogoThumbnail";

interface Props {
  league: League;
  logos: UploadedLogo[];
  assignments: Assignments;
  onAssignmentsChange: (assignments: Assignments) => void;
}

export default function LogoAssigner({
  league,
  logos,
  assignments,
  onAssignmentsChange,
}: Props) {
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const assignedLogoIds = new Set(Object.values(assignments));
  const unassignedLogos = logos.filter((l) => !assignedLogoIds.has(l.id));
  const logoMap = new Map(logos.map((l) => [l.id, l]));

  const totalTeams = league.conferences.reduce(
    (sum, c) => sum + c.divisions.reduce((s, d) => s + d.teams.length, 0),
    0
  );
  const assignedCount = Object.keys(assignments).length;

  function handleTeamClick(teamId: string) {
    if (!selectedLogoId) return;
    const next = { ...assignments, [teamId]: selectedLogoId };
    onAssignmentsChange(next);
    setSelectedLogoId(null);
  }

  function unassign(teamId: string) {
    const next = { ...assignments };
    delete next[teamId];
    onAssignmentsChange(next);
  }

  function clearAllAssignments() {
    onAssignmentsChange({});
    setSelectedLogoId(null);
  }

  const hasTeams = totalTeams > 0;
  const hasLogos = logos.length > 0;

  if (!hasTeams || !hasLogos) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="h-12 w-12 text-zinc-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25"
          />
        </svg>
        <p className="text-zinc-400">
          {!hasTeams && !hasLogos
            ? "Define your league structure and upload logos first."
            : !hasTeams
              ? "Define your league structure in Step 1 first."
              : "Upload logos in Step 2 first."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress + instructions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {assignedCount} / {totalTeams} teams assigned
          {selectedLogoId && (
            <span className="ml-2 text-blue-400">
              — Click a team to assign the selected logo
            </span>
          )}
        </p>
        {assignedCount > 0 && (
          <button
            onClick={clearAllAssignments}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{
            width: `${totalTeams > 0 ? (assignedCount / totalTeams) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Unassigned logos */}
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            Unassigned Logos ({unassignedLogos.length})
          </h3>
          {unassignedLogos.length === 0 ? (
            <p className="text-xs text-zinc-600 py-4 text-center">
              All logos have been assigned.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-[500px] overflow-y-auto rounded-xl border border-zinc-800 p-3 bg-zinc-900/50">
              {unassignedLogos.map((logo) => (
                <LogoThumbnail
                  key={logo.id}
                  logo={logo}
                  selected={selectedLogoId === logo.id}
                  onClick={() =>
                    setSelectedLogoId(
                      selectedLogoId === logo.id ? null : logo.id
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: League tree */}
        <div>
          <h3 className="text-sm font-medium text-zinc-300 mb-3">
            League Structure
          </h3>

          {/* Search */}
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-9 pr-8 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                &times;
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto rounded-xl border border-zinc-800 p-3 bg-zinc-900/50">
            {(() => {
              const q = search.toLowerCase();
              let hasResults = false;

              const tree = league.conferences.map((conf) => {
                const filteredDivs = conf.divisions
                  .map((div) => {
                    const filteredTeams = div.teams.filter((t) =>
                      !q || t.name.toLowerCase().includes(q)
                    );
                    return { div, filteredTeams };
                  })
                  .filter(({ filteredTeams }) => filteredTeams.length > 0);

                if (filteredDivs.length === 0) return null;
                hasResults = true;

                return (
                  <div key={conf.id}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      {conf.name}
                    </h4>
                    {filteredDivs.map(({ div, filteredTeams }) => (
                      <div key={div.id} className="mb-3 ml-2">
                        <h5 className="text-xs font-medium text-zinc-400 mb-1.5">
                          {div.name}
                        </h5>
                        <div className="space-y-1 ml-2">
                          {filteredTeams.map((team) => {
                            const assignedLogoId = assignments[team.id];
                            const assignedLogo = assignedLogoId
                              ? logoMap.get(assignedLogoId)
                              : null;

                            return (
                              <button
                                key={team.id}
                                type="button"
                                onClick={() =>
                                  assignedLogo
                                    ? unassign(team.id)
                                    : handleTeamClick(team.id)
                                }
                                className={`
                                  flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-all
                                  ${
                                    assignedLogo
                                      ? "bg-zinc-800 text-white"
                                      : selectedLogoId
                                        ? "bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 cursor-pointer ring-1 ring-blue-500/30"
                                        : "bg-zinc-800/50 text-zinc-400"
                                  }
                                `}
                              >
                                {assignedLogo ? (
                                  <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={assignedLogo.objectUrl}
                                      alt=""
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded bg-zinc-800 border border-dashed border-zinc-600 flex items-center justify-center shrink-0">
                                    <span className="text-zinc-600 text-xs">?</span>
                                  </div>
                                )}
                                <span className="truncate">{team.name}</span>
                                {assignedLogo && (
                                  <span className="ml-auto text-[10px] text-zinc-500 hover:text-red-400 shrink-0">
                                    click to remove
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              });

              if (!hasResults && q) {
                return (
                  <p className="text-xs text-zinc-600 py-4 text-center">
                    No teams matching &ldquo;{search}&rdquo;
                  </p>
                );
              }

              return tree;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
