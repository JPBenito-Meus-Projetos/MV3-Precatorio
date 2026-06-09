import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

const SMTP_HOST = process.env.SMTP_HOST || process.env.SERVER || "smtp.office365.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || process.env.FROM || SMTP_USER;
const PROPOSTA_DESTINO = process.env.PROPOSTA_DESTINO || process.env.TO || "joao.benito@mv3.com.br";

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function buildPropostaEmail({ nome, email, telefone, processo, valor, observacao }) {
  const rows = [
    ["Nome", nome],
    ["E-mail", email],
    ["Telefone", telefone],
    ["Número do Processo", processo],
    ["Valor", valor],
    ["Observação", observacao || "—"],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 18px;background:#f4f6f8;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0a1628;width:38%;font-size:14px;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;color:#334155;font-size:14px;">
            ${escapeHtml(value)}
          </td>
        </tr>`
    )
    .join("");

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Proposta — MNPR Capital</title>
</head>
<body style="margin:0;padding:0;background:#e8ecf1;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8ecf1;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #dde3ea;">
          <tr>
            <td style="background:#0a1628;padding:36px 40px 32px;border-bottom:3px solid #c9a227;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#ffffff;line-height:1;vertical-align:middle;padding-right:16px;">
                    MNPR
                  </td>
                  <td style="width:1px;background-color:#c9a227;font-size:0;line-height:0;">&nbsp;</td>
                  <td style="padding-left:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#c9a227;letter-spacing:0.32em;text-transform:uppercase;vertical-align:middle;">
                    CAPITAL
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#c9a227;font-weight:700;">
                Nova solicitação
              </p>
              <h1 style="margin:0;font-size:21px;line-height:1.35;color:#ffffff;font-weight:600;">
                Proposta de venda de precatório
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 8px;">
              <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#64748b;">
                Uma nova solicitação foi enviada pelo formulário do site:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
                ${tableRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 32px;">
              <p style="margin:0;font-size:13px;line-height:1.55;color:#94a3b8;">
                Para responder ao cliente, utilize <strong style="color:#64748b;">Responder</strong> — o e-mail de contato já está configurado.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                © MNPR Capital · Mensagem automática do site
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  return { text, html };
}

function validatePropostaPayload(body) {
  const { website } = body ?? {};
  if (website?.trim()) {
    return { ok: false, silent: true };
  }

  const nomeVal = truncate(body?.nome, LIMITS.nome);
  const emailVal = truncate(body?.email, LIMITS.email);
  const telefoneVal = truncate(body?.telefone, LIMITS.telefone);
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

  if (processoDigits.length < 7) {
    return { ok: false, message: "Informe o número do processo." };
  }

  if (!valorDigits || Number(valorDigits) <= 0) {
    return { ok: false, message: "Informe o valor do precatório." };
  }

  return {
    ok: true,
    dados: {
      nome: nomeVal,
      email: emailVal,
      telefone: telefoneVal,
      processo: processoVal,
      valor: valorVal,
      observacao: observacaoVal || "—",
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
  const { text, html } = buildPropostaEmail(dados);

  try {
    await getMailTransporter().sendMail({
      from: `"MNPR Capital" <${SMTP_FROM}>`,
      to: PROPOSTA_DESTINO,
      replyTo: dados.email,
      subject: "Venda de Precatório — MNPR Capital",
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
