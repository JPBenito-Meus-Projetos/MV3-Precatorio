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

const SMTP_HOST = process.env.SMTP_HOST || process.env.SERVER || "smtp.office365.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || process.env.FROM || SMTP_USER;
const PROPOSTA_DESTINO = process.env.PROPOSTA_DESTINO || process.env.TO || "joao.benito@mv3.com.br";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
<body style="margin:0;padding:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef1f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(10,22,40,0.12);">
          <tr>
            <td style="background:#0a1628;padding:28px 32px;border-bottom:4px solid #c9a227;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c9a227;font-weight:700;">
                MNPR Capital
              </p>
              <h1 style="margin:0;font-size:24px;line-height:1.3;color:#ffffff;font-weight:700;">
                Nova proposta de precatório
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#64748b;">
                Uma nova solicitação foi enviada pelo formulário do site. Confira os dados abaixo:
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                ${tableRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#94a3b8;">
                Para responder ao cliente, use o botão <strong>Responder</strong> — o e-mail de contato já está configurado como destinatário da resposta.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..")));

app.post("/api/enviar-proposta", async (req, res) => {
  const { nome, email, telefone, processo, valor, observacao } = req.body ?? {};

  const nomeVal = nome?.trim() ?? "";
  const emailVal = email?.trim() ?? "";
  const telefoneVal = telefone?.trim() ?? "";
  const processoVal = processo?.trim() ?? "";
  const valorVal = valor?.trim() ?? "";
  const telefoneDigits = telefoneVal.replace(/\D/g, "");
  const processoDigits = processoVal.replace(/\D/g, "");
  const valorDigits = valorVal.replace(/\D/g, "");

  if (nomeVal.length < 2) {
    return res.status(400).json({ ok: false, message: "Informe seu nome completo." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    return res.status(400).json({ ok: false, message: "Informe um e-mail válido." });
  }

  if (telefoneDigits.length < 10) {
    return res.status(400).json({ ok: false, message: "Informe um telefone válido com DDD." });
  }

  if (processoDigits.length < 7) {
    return res.status(400).json({ ok: false, message: "Informe o número do processo." });
  }

  if (!valorDigits || Number(valorDigits) <= 0) {
    return res.status(400).json({ ok: false, message: "Informe o valor do precatório." });
  }

  if (!SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({
      ok: false,
      message: "Servidor de e-mail não configurado. Verifique o arquivo .env",
    });
  }

  const dados = {
    nome: nomeVal,
    email: emailVal,
    telefone: telefoneVal,
    processo: processoVal,
    valor: valorVal,
    observacao: observacao?.trim() || "—",
  };

  const { text, html } = buildPropostaEmail(dados);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS.replace(/\s/g, ""),
    },
  });

  try {
    await transporter.sendMail({
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

    let message = "Não foi possível enviar a proposta. Verifique o .env e reinicie o servidor.";

    if (error.code === "EAUTH") {
      const response = String(error.response || "");

      if (response.includes("5.7.139") || response.includes("credentials were incorrect")) {
        message =
          "Senha ou usuário incorretos no .env. Coloque em SMTP_PASS a senha da conta joao.benito@mv3.com.br (ou senha de app da Microsoft, não do Google).";
      } else if (response.includes("SmtpClientAuthentication is disabled")) {
        message =
          "SMTP desabilitado na conta Microsoft 365. Peça ao administrador para habilitar 'SMTP AUTH' para joao.benito@mv3.com.br.";
      } else {
        message =
          "Falha na autenticação Microsoft 365. Verifique SMTP_USER e SMTP_PASS no .env.";
      }
    }

    res.status(500).json({ ok: false, message });
  }
});

app.listen(PORT, () => {
  console.log(`Site disponível em http://localhost:${PORT}`);
  console.log(`E-mail: ${SMTP_FROM} → ${PROPOSTA_DESTINO} (${SMTP_HOST})`);
});
