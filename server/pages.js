import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "..");

export function getSiteBase(req, siteUrl) {
  if (siteUrl) return siteUrl.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
}

export function phoneToTel(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export function injectPlaceholders(html, { siteBase, contactPhone, contactEmail }) {
  return html
    .replaceAll("__SITE_URL__", siteBase)
    .replaceAll("__CONTACT_PHONE__", contactPhone)
    .replaceAll("__CONTACT_EMAIL__", contactEmail)
    .replaceAll("__CONTACT_TEL__", phoneToTel(contactPhone));
}

export function loadPage(filename, vars) {
  const html = readFileSync(path.join(ROOT, filename), "utf8");
  return injectPlaceholders(html, vars);
}

export function buildRobots(siteBase) {
  return `User-agent: *
Allow: /

Sitemap: ${siteBase}/sitemap.xml
`;
}

export function buildSitemap(siteBase) {
  const lastmod = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteBase}/</loc><lastmod>${lastmod}</lastmod><priority>1.0</priority></url>
  <url><loc>${siteBase}/privacidade.html</loc><lastmod>${lastmod}</lastmod><priority>0.5</priority></url>
</urlset>`;
}
