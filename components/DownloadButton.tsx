"use client";

import { useState } from "react";
import { League, UploadedLogo, Assignments } from "@/lib/types";
import { generateZip } from "@/lib/zip";

interface Props {
  league: League;
  logos: UploadedLogo[];
  assignments: Assignments;
}

export default function DownloadButton({ league, logos, assignments }: Props) {
  const [generating, setGenerating] = useState(false);

  const assignedCount = Object.keys(assignments).length;
  const totalTeams = league.conferences.reduce(
    (sum, c) => sum + c.divisions.reduce((s, d) => s + d.teams.length, 0),
    0
  );

  const disabled = assignedCount === 0 || generating;

  async function handleDownload() {
    setGenerating(true);
    try {
      await generateZip(league, logos, assignments);
    } catch (err) {
      console.error("Failed to generate ZIP:", err);
      alert("Failed to generate ZIP file. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">Download Summary</h3>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-2xl font-bold text-white">
              {league.conferences.length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Conferences</p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-2xl font-bold text-white">{totalTeams}</p>
            <p className="text-xs text-zinc-500 mt-1">Teams</p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-2xl font-bold text-white">{assignedCount}</p>
            <p className="text-xs text-zinc-500 mt-1">Logos Assigned</p>
          </div>
        </div>

        {/* Folder preview */}
        {assignedCount > 0 && (
          <div className="rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-400 max-h-60 overflow-y-auto">
            <p className="text-zinc-300 mb-2">
              {league.name || "logos"}.zip
            </p>
            {league.conferences.map((conf) => (
              <div key={conf.id} className="ml-3">
                <p className="text-zinc-500">{conf.name}/</p>
                {conf.divisions.map((div) => {
                  const teamsWithLogos = div.teams.filter(
                    (t) => assignments[t.id]
                  );
                  if (teamsWithLogos.length === 0) return null;
                  return (
                    <div key={div.id} className="ml-3">
                      <p className="text-zinc-500">{div.name}/</p>
                      {teamsWithLogos.map((team) => {
                        return (
                          <p key={team.id} className="ml-3 text-green-400/70">
                            {team.name}
                            .png
                          </p>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={disabled}
        className={`
          w-full flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-base font-semibold transition-all
          ${
            disabled
              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
          }
        `}
      >
        {generating ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Generating ZIP...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download Organized Logos
          </>
        )}
      </button>

      {assignedCount === 0 && (
        <p className="text-center text-sm text-zinc-600">
          Assign logos to teams in Step 3 before downloading.
        </p>
      )}

      {assignedCount > 0 && assignedCount < totalTeams && (
        <p className="text-center text-sm text-yellow-500/70">
          {totalTeams - assignedCount} team
          {totalTeams - assignedCount !== 1 && "s"} still unassigned — they will
          be skipped in the download.
        </p>
      )}
    </div>
  );
}
