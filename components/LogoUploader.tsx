"use client";

import { useCallback, useRef, useState } from "react";
import { UploadedLogo } from "@/lib/types";
import LogoThumbnail from "./LogoThumbnail";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Props {
  logos: UploadedLogo[];
  onLogosChange: (logos: UploadedLogo[]) => void;
}

export default function LogoUploader({ logos, onLogosChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/") || f.name.endsWith(".svg")
      );
      const newLogos: UploadedLogo[] = imageFiles.map((file) => ({
        id: generateId(),
        file,
        objectUrl: URL.createObjectURL(file),
        originalName: file.name,
      }));
      onLogosChange([...logos, ...newLogos]);
    },
    [logos, onLogosChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  function clearAll() {
    logos.forEach((l) => URL.revokeObjectURL(l.objectUrl));
    onLogosChange([]);
  }

  function removeLogo(id: string) {
    const logo = logos.find((l) => l.id === id);
    if (logo) URL.revokeObjectURL(logo.objectUrl);
    onLogosChange(logos.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors
          ${dragOver ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"}
        `}
      >
        <svg
          className="h-10 w-10 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">
            Drop logo files here or click to browse
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            PNG, JPG, SVG, WebP accepted
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.svg"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Logo grid */}
      {logos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-zinc-400">
              {logos.length} logo{logos.length !== 1 && "s"} uploaded
            </p>
            <button
              onClick={clearAll}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {logos.map((logo) => (
              <div key={logo.id} className="relative group">
                <LogoThumbnail logo={logo} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLogo(logo.id);
                  }}
                  className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
