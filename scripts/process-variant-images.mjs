
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "variant-assets-source");
const outputRoot = path.join(projectRoot, "public", "products", "variants");
const manifestPath = path.join(projectRoot, "lib", "variant-image-manifest.json");

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const MAX_WIDTH = 1400;
const WEBP_QUALITY = 84;

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPublicUrl(filePath) {
  return "/" + path.relative(path.join(projectRoot, "public"), filePath)
    .split(path.sep)
    .join("/");
}

async function main() {
  await fs.access(sourceRoot);
  await fs.mkdir(outputRoot, { recursive: true });

  const sourceFiles = await walk(sourceRoot);
  const manifest = {};
  let processed = 0;
  let failed = 0;

  for (const sourceFile of sourceFiles) {
    const relativePath = path.relative(sourceRoot, sourceFile);
    const relativeDirectory = path.dirname(relativePath);
    const sourceName = path.basename(sourceFile, path.extname(sourceFile));
    const outputDirectory = path.join(outputRoot, relativeDirectory);
    const outputFile = path.join(outputDirectory, `${sourceName}.webp`);

    try {
      await fs.mkdir(outputDirectory, { recursive: true });

      await sharp(sourceFile)
        .rotate()
        .resize({
          width: MAX_WIDTH,
          height: MAX_WIDTH,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: 5 })
        .toFile(outputFile);

      const url = toPublicUrl(outputFile);
      const relativeKey = relativePath.split(path.sep).join("/");

      manifest[relativeKey] = {
        url,
        bytes: (await fs.stat(outputFile)).size,
      };

      processed++;

      if (processed % 20 === 0) {
        console.log(`Processed ${processed}/${sourceFiles.length} images...`);
      }
    } catch (error) {
      failed++;
      console.error(`Failed: ${relativePath}`, error.message);
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log("\nImage processing complete.");
  console.log(`Found: ${sourceFiles.length}`);
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Images: ${outputRoot}`);
}

main().catch((error) => {
  console.error("Image processing could not start:", error);
  process.exitCode = 1;
});
