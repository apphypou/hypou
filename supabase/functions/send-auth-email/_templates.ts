// Branded HTML email templates for Hypou
// Dark theme, cyan #18FDF6 primary, Plus Jakarta Sans

const BG = "#1C1C1C";
const SURFACE = "#262626";
const PRIMARY = "#18FDF6";
const TEXT = "#FAFAFA";
const MUTED = "#A1A1AA";
const BORDER = "rgba(255,255,255,0.06)";
const LOGO_URL = "https://hypou.app/logo-hypou.png";

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
            <img src="${LOGO_URL}" alt="Hypou" width="120" style="display:inline-block;height:auto;max-width:120px;border:0;outline:none;text-decoration:none;" />
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

function codeBlock(token: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 0 auto;">
    <tr><td style="border-radius:16px;background:${BG};border:1px solid ${BORDER};padding:24px 32px;">
      <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:36px;font-weight:800;color:${PRIMARY};letter-spacing:0.4em;text-align:center;padding-left:0.4em;">${token}</div>
    </td></tr>
  </table>
  <p style="margin:16px 0 0 0;font-size:13px;color:${MUTED};text-align:center;">Este código expira em 1 hora.</p>`;
}

function fallbackLink(url: string, label: string): string {
  return `<p style="color:${MUTED};font-size:12px;line-height:1.6;margin:28px 0 0 0;text-align:center;">
    Ou <a href="${url}" style="color:${PRIMARY};text-decoration:none;">${label}</a> se preferir.
  </p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:${TEXT};text-align:center;letter-spacing:-0.01em;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${MUTED};text-align:center;">${text}</p>`;
}

export function signupTemplate(url: string, token: string): { subject: string; html: string } {
  const html = shell(
    "Seu código de confirmação Hypou",
    `Seu código: ${token}`,
    `${heading("Bem-vindo ao Hypou!")}
     ${paragraph("Use o código abaixo no app pra confirmar seu e-mail e começar a trocar.")}
     ${codeBlock(token)}
     ${fallbackLink(url, "confirmar pelo link")}`,
  );
  return { subject: `Seu código Hypou: ${token}`, html };
}

export function recoveryTemplate(url: string, token: string): { subject: string; html: string } {
  const html = shell(
    "Redefinir senha do Hypou",
    `Seu código: ${token}`,
    `${heading("Redefinir sua senha")}
     ${paragraph("Use o código abaixo no app pra criar uma nova senha.")}
     ${codeBlock(token)}
     ${fallbackLink(url, "redefinir pelo link")}`,
  );
  return { subject: `Código de recuperação Hypou: ${token}`, html };
}

export function magicLinkTemplate(url: string, token: string): { subject: string; html: string } {
  const html = shell(
    "Seu código de acesso Hypou",
    `Seu código: ${token}`,
    `${heading("Entrar no Hypou")}
     ${paragraph("Use o código abaixo no app pra entrar na sua conta.")}
     ${codeBlock(token)}
     ${fallbackLink(url, "entrar pelo link")}`,
  );
  return { subject: `Seu código de acesso Hypou: ${token}`, html };
}

export function emailChangeTemplate(url: string, token: string): { subject: string; html: string } {
  const html = shell(
    "Confirme seu novo e-mail no Hypou",
    `Seu código: ${token}`,
    `${heading("Confirmar novo e-mail")}
     ${paragraph("Use o código abaixo no app pra confirmar a alteração do seu e-mail.")}
     ${codeBlock(token)}
     ${fallbackLink(url, "confirmar pelo link")}`,
  );
  return { subject: `Código para alterar e-mail Hypou: ${token}`, html };
}

export function inviteTemplate(url: string, token: string): { subject: string; html: string } {
  const html = shell(
    "Você foi convidado para o Hypou",
    `Seu código: ${token}`,
    `${heading("Você foi convidado!")}
     ${paragraph("Use o código abaixo no app pra aceitar o convite e criar sua conta.")}
     ${codeBlock(token)}
     ${fallbackLink(url, "aceitar pelo link")}`,
  );
  return { subject: `Convite Hypou — código: ${token}`, html };
}
