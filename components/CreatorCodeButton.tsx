"use client";

import { useState } from "react";

export default function CreatorCodeButton({
  code,
}: {
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="ambassador-code-button"
      onClick={() => void copyCode()}
    >
      {copied ? "CODE COPIÉ ✓" : `COPIER LE CODE — ${code}`}
    </button>
  );
}