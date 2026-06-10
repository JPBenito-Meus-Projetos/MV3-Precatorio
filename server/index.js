import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { buildPropostaEmail } from "./email-proposta.js";
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

let mailTransporter = null;

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

function validatePropostaPayload(body) {
  const { website } = body ?? {};
  if (website?.trim()) {
    return { ok: false, silent: true };
  }

  const nomeVal = truncate(body?.nome, LIMITS.nome);
  const emailVal = truncate(body?.email, LIMITS.email);
  const telefoneVal = truncate(body?.telefone, LIMITS.telefone);
  const perfilVal = truncate(body?.perfil, 30);
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

  if (processoDigits.length < 7) {
    return { ok: false, message: "Informe o número do processo." };
  }

  if (!valorDigits || Number(valorDigits) <= 0) {
    return { ok: false, message: "Informe o valor do precatório." };
  }

  const prioridade = avaliarPrioridade(perfilVal, valorDigits);

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
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.static(path.join(__dirname, "..")));

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
  const { text, html } = buildPropostaEmail(dados, { logoUrl: EMAIL_LOGO_URL });

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

app.listen(PORT, () => {
  console.log(`Site disponível em http://localhost:${PORT}`);
  console.log(`E-mail: ${SMTP_FROM} → ${PROPOSTA_DESTINO} (${SMTP_HOST})`);
});
