"use client";

import { useState, useEffect, useCallback } from "react";
import { League, UploadedLogo, Assignments } from "@/lib/types";
import { saveLeague, loadLeague } from "@/lib/storage";
import LeagueBuilder from "@/components/LeagueBuilder";
import LogoUploader from "@/components/LogoUploader";
import LogoAssigner from "@/components/LogoAssigner";
import DownloadButton from "@/components/DownloadButton";

const STEPS = [
  { id: 1, label: "Structure" },
  { id: 2, label: "Upload" },
  { id: 3, label: "Assign" },
  { id: 4, label: "Download" },
];

const defaultLeague: League = { name: "", conferences: [] };

export default function Home() {
  const [step, setStep] = useState(1);
  const [league, setLeague] = useState<League>(defaultLeague);
  const [logos, setLogos] = useState<UploadedLogo[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadLeague();
    if (saved) setLeague(saved);
    setLoaded(true);
  }, []);

  const handleLeagueChange = useCallback((updated: League) => {
    setLeague(updated);
    saveLeague(updated);
  }, []);

  const handleAssignmentsChange = useCallback((updated: Assignments) => {
    setAssignments(updated);
  }, []);

  const totalTeams = league.conferences.reduce(
    (sum, c) => sum + c.divisions.reduce((s, d) => s + d.teams.length, 0),
    0
  );

  function canProceed(s: number): boolean {
    if (s === 2) return league.name.trim().length > 0 && totalTeams > 0;
    if (s === 3) return logos.length > 0;
    if (s === 4) return Object.keys(assignments).length > 0;
    return true;
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-6.364-6.364L4.5 8.25"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Logo Linker</h1>
          </div>

          {/* Stepper */}
          <nav className="hidden sm:flex items-center gap-1">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`
                  flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all
                  ${
                    step === s.id
                      ? "bg-blue-600/15 text-blue-400 font-medium"
                      : "text-zinc-500 hover:text-zinc-300"
                  }
                `}
              >
                <span
                  className={`
                    flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold
                    ${
                      step === s.id
                        ? "bg-blue-600 text-white"
                        : step > s.id
                          ? "bg-zinc-700 text-zinc-300"
                          : "bg-zinc-800 text-zinc-600"
                    }
                  `}
                >
                  {step > s.id ? "✓" : s.id}
                </span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile stepper */}
        <div className="sm:hidden flex border-t border-zinc-800">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`
                flex-1 py-2 text-xs font-medium text-center transition-colors
                ${step === s.id ? "text-blue-400 border-b-2 border-blue-500" : "text-zinc-600"}
              `}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Step title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">
            {step === 1 && "Define League Structure"}
            {step === 2 && "Upload Logos"}
            {step === 3 && "Assign Logos to Teams"}
            {step === 4 && "Download"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {step === 1 &&
              "Add your conferences, divisions, and teams. This data is saved locally."}
            {step === 2 &&
              "Upload all your logo files. They can have any name — you'll assign them next."}
            {step === 3 &&
              "Select a logo on the left, then click a team on the right to link them."}
            {step === 4 &&
              "Download all assigned logos as a ZIP file organized into folders."}
          </p>
        </div>

        {/* Step content */}
        <div className="mb-8">
          {step === 1 && (
            <LeagueBuilder league={league} onChange={handleLeagueChange} />
          )}
          {step === 2 && (
            <LogoUploader logos={logos} onLogosChange={setLogos} />
          )}
          {step === 3 && (
            <LogoAssigner
              league={league}
              logos={logos}
              assignments={assignments}
              onAssignmentsChange={handleAssignmentsChange}
            />
          )}
          {step === 4 && (
            <DownloadButton
              league={league}
              logos={logos}
              assignments={assignments}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`
              rounded-lg px-5 py-2.5 text-sm font-medium transition-colors
              ${step === 1 ? "text-zinc-700 cursor-not-allowed" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}
            `}
          >
            Back
          </button>

          {step < 4 && (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              disabled={!canProceed(step + 1)}
              className={`
                rounded-lg px-5 py-2.5 text-sm font-medium transition-colors
                ${
                  canProceed(step + 1)
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }
              `}
            >
              Continue
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
