import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(__dirname, "..", "IMG");
const source = path.join(imgDir, "logo-adaptavel.png");
const output = path.join(imgDir, "logo-header.png");
const output2x = path.join(imgDir, "logo-header@2x.png");

/** Remove fundo preto e converte artefatos cinza em branco com alpha limpo. */
function decontaminateWhiteOnBlack(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.max(r, g, b);

    if (lum < 32) {
      data[i + 3] = 0;
      continue;
    }

    const alpha = Math.min(255, Math.round(((lum - 32) / (255 - 32)) * 255));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = alpha;
  }
}

async function buildLogo({ scale = 1, dest }) {
  const trimmed = await sharp(source).trim({ threshold: 12 }).toBuffer();
  const meta = await sharp(trimmed).metadata();

  let pipeline = sharp(trimmed);
  if (scale !== 1) {
    pipeline = pipeline.resize({
      width: Math.round(meta.width * scale),
      height: Math.round(meta.height * scale),
      kernel: sharp.kernel.lanczos3,
    });
  }

  const { data, info } = await pipeline
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  decontaminateWhiteOnBlack(data);

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .sharpen({ sigma: 0.45, m1: 0.6, m2: 0.35 })
    .png({ compressionLevel: 6, quality: 100, effort: 10 })
    .toFile(dest);

  return info;
}

const base = await buildLogo({ scale: 1, dest: output });
await buildLogo({ scale: 2, dest: output2x });

console.log(`logo-header.png: ${base.width}x${base.height}`);
console.log(`logo-header@2x.png: ${base.width * 2}x${base.height * 2}`);
