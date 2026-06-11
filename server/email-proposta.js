function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLogoHeader({ logoUrl = "", logoCid = "", siteUrl = "" } = {}) {
  const src = logoCid ? `cid:${logoCid}` : logoUrl;

  if (src) {
    const homeUrl = siteUrl || "https://www.mv3.com.br";
    return `
      <a href="${escapeHtml(homeUrl)}" target="_blank" style="text-decoration:none;">
        <img
          src="${escapeHtml(src)}"
          width="103"
          height="58"
          alt="MNPR Capital"
          style="display:block;margin:0 auto;height:58px;width:auto;max-width:120px;border:0;"
        >
      </a>`;
  }

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
      <tr>
        <td style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#ffffff;line-height:1;vertical-align:middle;padding-right:14px;">
          MNPR
        </td>
        <td style="width:1px;background-color:#c9a227;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding-left:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;color:#c9a227;letter-spacing:0.32em;text-transform:uppercase;vertical-align:middle;">
          CAPITAL
        </td>
      </tr>
    </table>`;
}

export function buildPropostaEmail(dados, options = {}) {
  const { nome, email, telefone, perfil, processo, valor, observacao, prioridade } = dados;
  const { logoUrl = "", logoCid = "", siteUrl = "" } = options;

  const rows = [
    ["Perfil", perfil],
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
          <td width="38%" style="padding:14px 18px;background-color:#f8f9fa;border-bottom:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#0a1628;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:14px 18px;border-bottom:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
            ${escapeHtml(value)}
          </td>
        </tr>`
    )
    .join("");

  const text = [
    prioridade ? `${prioridade.label} (${prioridade.score} pts)` : "",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Para responder ao cliente, use Responder — o e-mail de contato já está configurado.",
  ]
    .filter(Boolean)
    .join("\n");

  const logoHtml = buildLogoHeader({ logoUrl, logoCid, siteUrl });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Nova Proposta — MNPR Capital</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap');
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; max-width: 100% !important; }
    .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
    .hero-title { font-size: 26px !important; }
  }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;width:100%;font-family:'Inter',Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:24px 12px;">

        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" align="center" style="width:100%;max-width:600px;background-color:#ffffff;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#0a1628;padding:30px 40px;border-bottom:2px solid #c9a227;" class="mobile-padding">
              ${logoHtml}
            </td>
          </tr>

          <!-- Subheader -->
          <tr>
            <td style="background-color:#0a1628;padding:0 40px 28px;" class="mobile-padding">
              <p style="margin:20px 0 8px;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#c9a227;text-align:center;">
                Nova solicitação
              </p>
              <h1 class="hero-title" style="margin:0;font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.3;color:#ffffff;text-align:center;">
                Proposta de venda de precatório
              </h1>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 48px 28px;" class="mobile-padding">
              <p style="margin:0 0 24px;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#333333;">
                Uma nova solicitação foi enviada pelo formulário do site:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;">
                ${tableRows}
              </table>

              <p style="margin:24px 0 0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
                Para responder ao cliente, utilize <strong style="color:#333333;">Responder</strong> — o e-mail de contato já está configurado.
              </p>
            </td>
          </tr>

          <!-- CTA interno -->
          <tr>
            <td align="center" style="background-color:#ffffff;padding:0 48px 36px;" class="mobile-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="background-color:#c9a227;border-radius:4px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="mailto:${escapeHtml(email)}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="9%" strokecolor="#c9a227" fillcolor="#c9a227">
                      <w:anchorlock/>
                      <center style="color:#0a1628;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;">Responder ao cliente</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="mailto:${escapeHtml(email)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;color:#0a1628;background-color:#c9a227;border-radius:4px;">
                      Responder ao cliente
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0a1628;padding:28px 40px;" class="mobile-padding">
              <p style="margin:0 0 12px;font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:600;color:#ffffff;text-align:center;">
                MNPR Capital
              </p>
              <p style="margin:0 0 16px;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:#a0aabf;text-align:center;">
                &copy; ${new Date().getFullYear()} MNPR Capital · Mensagem automática do site
              </p>
              <p style="margin:0;font-family:'Inter',Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:#7a8699;text-align:center;">
                <strong style="color:#a0aabf;">Aviso legal:</strong> Informações de caráter institucional. Não constitui oferta pública,
                consultoria de investimentos ou recomendação personalizada. Operações com precatórios envolvem riscos específicos.
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
