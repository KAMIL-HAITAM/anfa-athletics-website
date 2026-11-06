"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type OutfitTopStyle = "tee" | "hoodie" | "compression" | "crop" | "bra";
export type OutfitBottomStyle = "jogger" | "leggings" | "shorts";

type CharacterCreatorWindow = Window & {
  __ready?: boolean;
  __set?: (key: string, value: unknown) => Promise<unknown> | unknown;
};

type OutfitLab3DViewProps = {
  topColor: string;
  bottomColor: string;
  topStyle: OutfitTopStyle;
  bottomStyle: OutfitBottomStyle;
};

/*
 * CharacterCreator's CC0 GLB assets are rendered by its own viewer runtime.
 * Upstream viewer code is GPL-3.0-or-later; retain its licence/notices and
 * comply with the source-distribution terms when shipping that runtime.
 *
 * Temporary closest-fit mappings (not final ANFA garment meshes):
 * - crop/compression -> T-shirt
 * - jogger/leggings -> jeans
 * Replace these mappings when ANFA-specific garment GLBs are ready.
 */
const TOP_ASSET: Record<OutfitTopStyle, string> = {
  tee: "tshirt",
  hoodie: "hoodie",
  compression: "tshirt",
  crop: "tshirt",
  bra: "bra",
};

const BOTTOM_ASSET: Record<OutfitBottomStyle, string> = {
  jogger: "jeans",
  leggings: "jeans",
  shorts: "shorts",
};

const VIEWER_SRC =
  "/charactercreator/index.html?lang=en&underwear=0&outfit=tshirt,jeans,shoes";

export default function OutfitLab3DView({
  topColor,
  bottomColor,
  topStyle,
  bottomStyle,
}: OutfitLab3DViewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const updateQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const [viewerError, setViewerError] = useState(false);

  // Hide CharacterCreator's own editing sidebar: ANFA's existing controls stay
  // outside the iframe, and the embedded viewer is just the rotating character.
  useEffect(() => {
    if (!frameLoaded) return;

    let elapsedMs = 0;
    const poll = window.setInterval(() => {
      const child = frameRef.current?.contentWindow as CharacterCreatorWindow | null;
      if (!child) {
        elapsedMs += 150;
      } else {
        try {
          const doc = child.document;
          const sidebar = doc.getElementById("ui");
          const status = doc.getElementById("status");

          sidebar?.style.setProperty("display", "none", "important");
          const failed = status?.classList.contains("error") ?? false;
          status?.style.setProperty("display", "none", "important");

          if (failed) {
            setViewerError(true);
            window.clearInterval(poll);
            return;
          }

          if (child.__ready) {
            setViewerReady(true);
            setViewerError(false);
            window.clearInterval(poll);
            return;
          }
        } catch {
          // The page is still starting up; try again on the next poll.
        }
        elapsedMs += 150;
      }

      if (elapsedMs >= 45000) {
        setViewerError(true);
        window.clearInterval(poll);
      }
    }, 150);

    return () => window.clearInterval(poll);
  }, [frameLoaded]);

  // Drive the embedded model from the same props the original mannequin used.
  // CharacterCreator handles skin clipping, garment fit, and tinting internally.
  useEffect(() => {
    if (!viewerReady) return;

    let cancelled = false;

    const syncOutfit = async () => {
      const child = frameRef.current?.contentWindow as CharacterCreatorWindow | null;
      if (!child?.__set) return;

      const set = child.__set.bind(child);
      const topAsset = TOP_ASSET[topStyle];
      const bottomAsset = BOTTOM_ASSET[bottomStyle];

      try {
        // The bra option uses the female base body; other current styles use male.
        await set("sex", topStyle === "bra" ? "female" : "male");
        if (cancelled) return;
        await set("underwear", false);
        if (cancelled) return;
        await set("outfit", [topAsset, bottomAsset, "shoes"]);
        if (cancelled) return;
        await set("clothColor", { id: topAsset, primary: topColor });
        if (cancelled) return;
        await set("clothColor", { id: bottomAsset, primary: bottomColor });

        if (!cancelled) setViewerError(false);
      } catch (error) {
        console.error("[ANFA Outfit Lab] Failed to update the 3D outfit:", error);
        if (!cancelled) setViewerError(true);
      }
    };

    updateQueueRef.current = updateQueueRef.current
      .catch(() => undefined)
      .then(syncOutfit);

    return () => {
      cancelled = true;
    };
  }, [viewerReady, topColor, bottomColor, topStyle, bottomStyle]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 440,
        overflow: "hidden",
        background: "#202126",
        borderRadius: 12,
      }}
    >
      <iframe
        ref={frameRef}
        title="ANFA ATHLETICS 3D outfit preview"
        src={VIEWER_SRC}
        onLoad={() => {
          setFrameLoaded(true);
          setViewerError(false);
        }}
        allow="fullscreen"
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: "#202126",
        }}
      />

      {!viewerReady && !viewerError && (
        <div
          role="status"
          style={overlayStyle}
        >
          Loading 3D character…
        </div>
      )}

      {viewerError && (
        <div role="alert" style={overlayStyle}>
          The 3D character did not load. Check that the CharacterCreator files are copied into
          <code style={{ marginLeft: 4 }}>/public/charactercreator</code> and reload the page.
        </div>
      )}
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  color: "#f4f4f5",
  background: "rgba(20, 21, 24, 0.88)",
  textAlign: "center",
  fontSize: 14,
  lineHeight: 1.5,
};
