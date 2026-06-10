import { readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, "..", "IMG");

const targets = ["hero-bg.png", "cases-detail.png", "processo-tech.png", "sobre-texture.png"];

async function compress(file) {
  const input = path.join(imgDir, file);
  const tmp = path.join(imgDir, `.${file}.tmp`);
  const before = (await stat(input)).size;

  await sharp(input)
    .resize({ width: 1920, withoutEnlargement: true })
    .png({ quality: 78, compressionLevel: 9, palette: true })
    .toFile(tmp);

  const { rename, unlink } = await import("fs/promises");
  await unlink(input);
  await rename(tmp, input);

  const after = (await stat(input)).size;
  const saved = ((1 - after / before) * 100).toFixed(1);
  console.log(`${file}: ${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB (−${saved}%)`);
}

for (const file of targets) {
  try {
    await compress(file);
  } catch (err) {
    console.warn(`Ignorado ${file}:`, err.message);
  }
}

console.log("Concluído.");
