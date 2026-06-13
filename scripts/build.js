import dotenv from "dotenv";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { injectPlaceholders } from "../server/pages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");

dotenv.config({ path: path.join(ROOT, ".env") });

const siteBase = (process.env.SITE_URL || "https://www.mnprcapital.com.br").replace(/\/$/, "");
const contactPhone = process.env.CONTACT_PHONE || "(11) 3000-0000";
const contactEmail = process.env.CONTACT_EMAIL || "contato@mnprcapital.com.br";

const vars = { siteBase, contactPhone, contactEmail };

function copyDir(src, dest) {
  cpSync(src, dest, { recursive: true });
}

mkdirSync(DIST, { recursive: true });

for (const page of ["index.html", "privacidade.html"]) {
  const html = readFileSync(path.join(ROOT, page), "utf8");
  writeFileSync(path.join(DIST, page), injectPlaceholders(html, vars), "utf8");
}

for (const file of ["styles.css", "script.js", "package.json", "package-lock.json"]) {
  cpSync(path.join(ROOT, file), path.join(DIST, file));
}

copyDir(path.join(ROOT, "IMG"), path.join(DIST, "IMG"));
copyDir(path.join(ROOT, "server"), path.join(DIST, "server"));

console.log("Build concluído em dist/");
console.log(`  Site: ${siteBase}`);
console.log(`  E-mail: ${contactEmail}`);
console.log(`  Telefone: ${contactPhone}`);
