import JSZip from "jszip";
import { saveAs } from "file-saver";
import { League, UploadedLogo, Assignments } from "./types";

function convertToPng(logo: UploadedLogo): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/png"
      );
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${logo.originalName}`));
    img.crossOrigin = "anonymous";
    img.src = logo.objectUrl;
  });
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

        const path = `${league.name}/${conf.name}/${div.name}/${team.name}.png`;
        const pngBlob = await convertToPng(logo);
        zip.file(path, pngBlob);
      }
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${league.name || "logos"}.zip`);
}
