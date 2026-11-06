
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();

const sourceDir = path.join(
  root,
  "recolor-source",
  "jogger-design01"
);

const outputDir = path.join(
  root,
  "public",
  "products",
  "recolor-jogger-gallery-v2"
);

const views = [
  "anfa_athletics_jogger_01_front_view.png",
  "anfa_athletics_jogger_02_three_quarter_front.png",
  "anfa_athletics_jogger_03_side_profile.png",
  "anfa_athletics_jogger_04_back_view.png",
  "anfa_athletics_jogger_05_three_quarter_rear.png",
];

const targets = [
  { name: "gris-beton", rgb: [119, 123, 121] },
  { name: "olive-tactique", rgb: [84, 91, 66] },
];

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const luminance = (r, g, b) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

function estimateBackground(data, info) {
  const samples = [];
  const size = 16;
  const margin = 8;

  const patches = [
    [margin, margin],
    [info.width - margin - size, margin],
    [margin, info.height - margin - size],
    [info.width - margin - size, info.height - margin - size],
  ];

  for (const [sx, sy] of patches) {
    for (let y = sy; y < sy + size; y++) {
      for (let x = sx; x < sx + size; x++) {
        const i = (y * info.width + x) * info.channels;
        samples.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }

  return [0, 1, 2].map(
    (channel) =>
      samples.reduce((sum, pixel) => sum + pixel[channel], 0) /
      samples.length
  );
}

// Marks light background pixels connected to the image boundary.
function buildBackgroundMask(data, info, background) {
  const { width, height, channels } = info;
  const count = width * height;

  const candidate = new Uint8Array(count);
  const backgroundMask = new Uint8Array(count);
  const queue = new Int32Array(count);

  for (let p = 0; p < count; p++) {
    const i = p * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const y = luminance(r, g, b);
    const dr = r - background[0];
    const dg = g - background[1];
    const db = b - background[2];
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    // Only light pixels sufficiently similar to the studio background
    // can be background candidates. Dark fabric cannot flood-fill.
    if (y > 130 && distance < 135) {
      candidate[p] = 1;
    }
  }

  let head = 0;
  let tail = 0;

  function seed(p) {
    if (candidate[p] && !backgroundMask[p]) {
      backgroundMask[p] = 1;
      queue[tail++] = p;
    }
  }

  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }

  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % width;

    if (x > 0) seed(p - 1);
    if (x < width - 1) seed(p + 1);
    if (p >= width) seed(p - width);
    if (p < count - width) seed(p + width);
  }

  return backgroundMask;
}

async function processImage(filename, target) {
  const input = path.join(sourceDir, filename);

  const { data, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = estimateBackground(data, info);
  const backgroundMask = buildBackgroundMask(data, info, background);
  const output = Buffer.from(data);

  const [tr, tg, tb] = target.rgb;
  const { width, height, channels } = info;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Keep the mannequin neck and outer perimeter unchanged.
      if (
        x < width * 0.18 ||
        x > width * 0.82 ||
        y < height * 0.075 ||
        y > height * 0.96
      ) {
        continue;
      }

      const p = y * width + x;

      // Never recolour background connected to the image boundary.
      if (backgroundMask[p]) continue;

      const i = p * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const originalLuma = luminance(r, g, b);
      const dr = r - background[0];
      const dg = g - background[1];
      const db = b - background[2];
      const distance = Math.sqrt(dr * dr + dg * dg + db * db);

      // Protect isolated light areas that resemble the studio background.
      if (originalLuma > 130 && distance < 135) continue;

      const normalizedLuma = clamp(
        (originalLuma - 4) / 100,
        0,
        1
      );

      const shade = target.name === "gris-beton"
        ? clamp(
            0.34 + 1.05 * Math.pow(normalizedLuma, 0.55),
            0.30,
            1.22
          )
        : 0.18 + 0.82 * Math.pow(normalizedLuma, 0.65);

      output[i] = Math.round(clamp(tr * shade, 0, 255));
      output[i + 1] = Math.round(clamp(tg * shade, 0, 255));
      output[i + 2] = Math.round(clamp(tb * shade, 0, 255));
    }
  }

  const stem = path.basename(filename, path.extname(filename));
  const outputPath = path.join(
    outputDir,
    `${stem}__${target.name}.webp`
  );

  await sharp(output, {
    raw: {
      width,
      height,
      channels,
    },
  })
    .webp({ quality: 90 })
    .toFile(outputPath);

  console.log(`Created: ${path.basename(outputPath)}`);
}

async function main() {
  await fs.access(sourceDir);
  await fs.mkdir(outputDir, { recursive: true });

  for (const filename of views) {
    await fs.access(path.join(sourceDir, filename));
  }

  let processed = 0;

  for (const view of views) {
    for (const target of targets) {
      await processImage(view, target);
      processed++;
    }
  }

  console.log(`\nCreated ${processed} preview images.`);
  console.log(`Output folder: ${outputDir}`);
  console.log("Originals and storefront mapping were not changed.");
}

main().catch((error) => {
  console.error("Gallery processing failed:", error);
  process.exitCode = 1;
});
