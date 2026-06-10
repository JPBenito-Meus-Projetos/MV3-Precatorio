import cors from "cors";
import dotenv from "dotenv";
import { existsSync } from "fs";
import express from "express";
import helmet from "helmet";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { buildPropostaEmail } from "./email-proposta.js";
import {
  ROOT,
  buildRobots,
  buildSitemap,
  getSiteBase,
  loadPage,
} from "./pages.js";
import { PERFIS_VALIDOS, avaliarPrioridade } from "./prioridade.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.office365.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const PROPOSTA_DESTINO = process.env.PROPOSTA_DESTINO || "joao.benito@mv3.com.br";
const EMAIL_LOGO_URL = process.env.EMAIL_LOGO_URL || "";
const SITE_URL = process.env.SITE_URL || "";
const CONTACT_PHONE = process.env.CONTACT_PHONE || "(11) 3000-0000";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || PROPOSTA_DESTINO;

const LIMITS = {
  nome: 120,
  email: 254,
  telefone: 16,
  processo: 25,
  valor: 20,
  observacao: 2000,
};

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const rateLimitStore = new Map();
const EMAIL_LOGO_CID = "mnpr-logo";
const EMAIL_LOGO_PATH = path.join(ROOT, "IMG", "logo-header.png");

let mailTransporter = null;

function resolveEmailLogo(req) {
  const siteUrl = getSiteBase(req, SITE_URL);

  if (EMAIL_LOGO_URL) {
    return { logoUrl: EMAIL_LOGO_URL, siteUrl, attachments: [] };
  }

  if (!existsSync(EMAIL_LOGO_PATH)) {
    return { siteUrl, attachments: [] };
  }

  return {
    logoCid: EMAIL_LOGO_CID,
    siteUrl,
    attachments: [
      {
        filename: "logo-header.png",
        path: EMAIL_LOGO_PATH,
        cid: EMAIL_LOGO_CID,
      },
    ],
  };
}

function pageVars(req) {
  const siteBase = getSiteBase(req, SITE_URL);
  return { siteBase, contactPhone: CONTACT_PHONE, contactEmail: CONTACT_EMAIL };
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.start > RATE_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, start: now });
    return false;
  }

  record.count += 1;
  return record.count > RATE_MAX_REQUESTS;
}

function getMailTransporter() {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS.replace(/\s/g, ""),
      },
    });
  }
  return mailTransporter;
}

function truncate(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function hasConsent(body) {
  const value = body?.consent;
  return value === true || value === "true" || value === "1" || value === 1;
}

function validatePropostaPayload(body) {
  const { website } = body ?? {};
  if (website?.trim()) {
    return { ok: false, silent: true };
  }

  if (!hasConsent(body)) {
    return { ok: false, message: "É necessário aceitar a Política de Privacidade." };
  }

  const nomeVal = truncate(body?.nome, LIMITS.nome);
  const emailVal = truncate(body?.email, LIMITS.email);
  const telefoneVal = truncate(body?.telefone, LIMITS.telefone);
  const perfilVal = truncate(body?.perfil, 30);
  const perfilOutroVal = truncate(body?.perfil_outro, 80);
  const processoVal = truncate(body?.processo, LIMITS.processo);
  const valorVal = truncate(body?.valor, LIMITS.valor);
  const observacaoVal = truncate(body?.observacao, LIMITS.observacao);

  const telefoneDigits = telefoneVal.replace(/\D/g, "");
  const processoDigits = processoVal.replace(/\D/g, "");
  const valorDigits = valorVal.replace(/\D/g, "");

  if (nomeVal.length < 2) {
    return { ok: false, message: "Informe seu nome completo." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    return { ok: false, message: "Informe um e-mail válido." };
  }

  if (telefoneDigits.length < 10) {
    return { ok: false, message: "Informe um telefone válido com DDD." };
  }

  if (!PERFIS_VALIDOS.includes(perfilVal)) {
    return { ok: false, message: "Selecione um perfil válido." };
  }

  if (perfilVal === "outro" && perfilOutroVal.trim().length < 2) {
    return { ok: false, message: "Especifique seu perfil — campo obrigatório." };
  }

  if (processoDigits.length < 7) {
    return { ok: false, message: "Informe o número do processo." };
  }

  if (!valorDigits || Number(valorDigits) <= 0) {
    return { ok: false, message: "Informe o valor do precatório." };
  }

  const prioridade = avaliarPrioridade(
    perfilVal,
    valorDigits,
    perfilVal === "outro" ? perfilOutroVal : ""
  );

  return {
    ok: true,
    dados: {
      nome: nomeVal,
      email: emailVal,
      telefone: telefoneVal,
      perfil: prioridade.perfilLabel,
      processo: processoVal,
      valor: valorVal,
      observacao: observacaoVal || "—",
      prioridade,
    },
  };
}

app.disable("x-powered-by");

if (IS_PROD) {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"];
    if (proto && proto !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);

app.use(
  express.json({
    limit: "32kb",
  })
);
app.use(
  cors({
    origin: IS_PROD ? false : true,
    methods: ["GET", "POST"],
  })
);

app.get(["/", "/index.html"], (req, res) => {
  res.type("html").send(loadPage("index.html", pageVars(req)));
});

app.get("/privacidade.html", (req, res) => {
  res.type("html").send(loadPage("privacidade.html", pageVars(req)));
});

app.get("/robots.txt", (req, res) => {
  const { siteBase } = pageVars(req);
  res.type("text/plain").send(buildRobots(siteBase));
});

app.get("/sitemap.xml", (req, res) => {
  const { siteBase } = pageVars(req);
  res.type("application/xml").send(buildSitemap(siteBase));
});

app.use(express.static(ROOT, { index: false, dotfiles: "ignore" }));

app.post("/api/enviar-proposta", async (req, res) => {
  const clientIp = getClientIp(req);

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      ok: false,
      message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    });
  }

  const validation = validatePropostaPayload(req.body);

  if (!validation.ok) {
    if (validation.silent) {
      return res.json({
        ok: true,
        message: "Proposta enviada com sucesso! Entraremos em contato em breve.",
      });
    }
    return res.status(400).json({ ok: false, message: validation.message });
  }

  if (!SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({
      ok: false,
      message: "Servidor de e-mail não configurado.",
    });
  }

  const { dados } = validation;
  const logoOptions = resolveEmailLogo(req);
  const { text, html } = buildPropostaEmail(dados, logoOptions);

  try {
    await getMailTransporter().sendMail({
      from: `"MNPR Capital" <${SMTP_FROM}>`,
      to: PROPOSTA_DESTINO,
      replyTo: dados.email,
      subject: `${dados.prioridade.subjectTag}Venda de Precatório — MNPR Capital`,
      headers: {
        "X-MNPR-Prioridade": dados.prioridade.label,
        "X-MNPR-Score": String(dados.prioridade.score),
        "X-MNPR-Motivos": dados.prioridade.motivos.join(" | "),
      },
      text,
      html,
      attachments: logoOptions.attachments,
    });

    res.json({
      ok: true,
      message: "Proposta enviada com sucesso! Entraremos em contato em breve.",
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error.response || error.message);

    const message = IS_PROD
      ? "Não foi possível enviar a proposta. Tente novamente mais tarde."
      : "Não foi possível enviar a proposta. Verifique o .env e reinicie o servidor.";

    res.status(500).json({ ok: false, message });
  }
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("Página não encontrada.");
});

app.listen(PORT, () => {
  console.log(`Site disponível em http://localhost:${PORT}`);
  console.log(`E-mail: ${SMTP_FROM} → ${PROPOSTA_DESTINO} (${SMTP_HOST})`);
});
