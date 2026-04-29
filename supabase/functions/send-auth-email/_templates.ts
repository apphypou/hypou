// Branded HTML email templates for Hypou
// Dark theme, cyan #18FDF6 primary, Plus Jakarta Sans

const BG = "#1C1C1C";
const SURFACE = "#262626";
const PRIMARY = "#18FDF6";
const TEXT = "#FAFAFA";
const MUTED = "#A1A1AA";
const BORDER = "rgba(255,255,255,0.06)";

function shell(title: string, preheader: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Plus Jakarta Sans','Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${SURFACE};border:1px solid ${BORDER};border-radius:24px;overflow:hidden;">
        <tr>
          <td style="padding:36px 32px 8px 32px;text-align:center;">
            <div style="font-size:32px;font-weight:800;letter-spacing:-0.02em;">
              <span style="color:${TEXT};">hyp</span><span style="color:${PRIMARY};">ou</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 36px 32px;">
            ${bodyHtml}
          </td>
        </tr>
      </table>
      <div style="max-width:520px;margin-top:24px;text-align:center;color:${MUTED};font-size:12px;line-height:1.6;">
        Hypou — A nova forma de trocar.<br>
        Você está recebendo este e-mail porque uma ação foi solicitada na sua conta.<br>
        Se não foi você, ignore esta mensagem.
      </div>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0 auto;">
    <tr><td style="border-radius:9999px;background:${PRIMARY};">
      <a href="${url}" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:700;color:${BG};text-decoration:none;border-radius:9999px;">${label}</a>
    </td></tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `<p style="color:${MUTED};font-size:13px;line-height:1.6;margin:24px 0 0 0;text-align:center;">
    Se o botão não funcionar, copie e cole este link no navegador:<br>
    <a href="${url}" style="color:${PRIMARY};word-break:break-all;text-decoration:none;">${url}</a>
  </p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:${TEXT};text-align:center;letter-spacing:-0.01em;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${MUTED};text-align:center;">${text}</p>`;
}

export function signupTemplate(confirmationUrl: string): { subject: string; html: string } {
  const html = shell(
    "Confirme seu cadastro no Hypou",
    "Falta só um clique pra começar a trocar no Hypou.",
    `${heading("Bem-vindo ao Hypou! 🎉")}
     ${paragraph("Confirma seu e-mail pra começar a trocar com a galera.")}
     ${ctaButton(confirmationUrl, "Confirmar e-mail")}
     ${fallbackLink(confirmationUrl)}`,
  );
  return { subject: "Confirme seu e-mail no Hypou", html };
}

export function recoveryTemplate(confirmationUrl: string): { subject: string; html: string } {
  const html = shell(
    "Redefinir senha do Hypou",
    "Recebemos um pedido pra redefinir sua senha.",
    `${heading("Redefinir sua senha")}
     ${paragraph("Clica no botão abaixo pra criar uma nova senha. O link é válido por 1 hora.")}
     ${ctaButton(confirmationUrl, "Redefinir senha")}
     ${fallbackLink(confirmationUrl)}`,
  );
  return { subject: "Redefina sua senha do Hypou", html };
}

export function magicLinkTemplate(confirmationUrl: string): { subject: string; html: string } {
  const html = shell(
    "Seu link de acesso ao Hypou",
    "Entre no Hypou com um clique.",
    `${heading("Entrar no Hypou")}
     ${paragraph("Clica no botão abaixo pra entrar na sua conta. Sem senha, sem complicação.")}
     ${ctaButton(confirmationUrl, "Entrar agora")}
     ${fallbackLink(confirmationUrl)}`,
  );
  return { subject: "Seu link de acesso ao Hypou", html };
}

export function emailChangeTemplate(confirmationUrl: string): { subject: string; html: string } {
  const html = shell(
    "Confirme seu novo e-mail no Hypou",
    "Confirme a alteração do seu e-mail.",
    `${heading("Confirmar novo e-mail")}
     ${paragraph("Clica no botão abaixo pra confirmar a alteração do seu e-mail.")}
     ${ctaButton(confirmationUrl, "Confirmar novo e-mail")}
     ${fallbackLink(confirmationUrl)}`,
  );
  return { subject: "Confirme seu novo e-mail no Hypou", html };
}

export function inviteTemplate(confirmationUrl: string): { subject: string; html: string } {
  const html = shell(
    "Você foi convidado para o Hypou",
    "Aceite seu convite pra começar a trocar.",
    `${heading("Você foi convidado! 🎁")}
     ${paragraph("Aceita o convite pra criar sua conta no Hypou e começar a trocar.")}
     ${ctaButton(confirmationUrl, "Aceitar convite")}
     ${fallbackLink(confirmationUrl)}`,
  );
  return { subject: "Você foi convidado para o Hypou", html };
}
