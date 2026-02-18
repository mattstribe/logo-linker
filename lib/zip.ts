import JSZip from "jszip";
import { saveAs } from "file-saver";
import { League, UploadedLogo, Assignments } from "./types";

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx) : ".png";
}

export async function generateZip(
  league: League,
  logos: UploadedLogo[],
  assignments: Assignments
): Promise<void> {
  const zip = new JSZip();
  const logoMap = new Map(logos.map((l) => [l.id, l]));

  for (const conf of league.conferences) {
    for (const div of conf.divisions) {
      for (const team of div.teams) {
        const logoId = assignments[team.id];
        if (!logoId) continue;
        const logo = logoMap.get(logoId);
        if (!logo) continue;

        const ext = getExtension(logo.originalName);
        const path = `${league.name}/${conf.name}/${div.name}/${team.name}${ext}`;
        const arrayBuffer = await logo.file.arrayBuffer();
        zip.file(path, arrayBuffer);
      }
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${league.name || "logos"}.zip`);
}
