"use client";

import { UploadedLogo } from "@/lib/types";

interface Props {
  logo: UploadedLogo;
  selected?: boolean;
  assigned?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

export default function LogoThumbnail({
  logo,
  selected = false,
  assigned = false,
  onClick,
  size = "md",
}: Props) {
  const dim = size === "sm" ? "w-12 h-12" : "w-20 h-20";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all
        ${selected ? "bg-blue-600/20 ring-2 ring-blue-500" : "hover:bg-zinc-800"}
        ${assigned ? "opacity-40" : ""}
      `}
      title={logo.originalName}
    >
      <div
        className={`${dim} rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.objectUrl}
          alt={logo.originalName}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      {size === "md" && (
        <span className="w-20 truncate text-center text-[10px] text-zinc-500 group-hover:text-zinc-300">
          {logo.originalName}
        </span>
      )}
    </button>
  );
}
