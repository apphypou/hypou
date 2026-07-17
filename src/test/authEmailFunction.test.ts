import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "supabase/functions/send-auth-email/index.ts"),
  "utf8",
);
const templates = readFileSync(
  join(process.cwd(), "supabase/functions/send-auth-email/_templates.ts"),
  "utf8",
);

describe("send-auth-email", () => {
  it("sends a plain-text alternative with the OTP", () => {
    expect(source).toContain("function renderPlainText");
    expect(source).toContain("text,");
    expect(source).toContain("Seu código de confirmação é: ${token}");
  });

  it("keeps signature verification before contacting Resend", () => {
    expect(source.indexOf("wh.verify(payloadRaw, headers)")).toBeLessThan(
      source.indexOf('fetch("https://api.resend.com/emails"'),
    );
  });

  it("forces the branded HTML email to stay dark in mail clients", () => {
    expect(templates).toContain('<meta name="color-scheme" content="dark">');
    expect(templates).toContain('<meta name="supported-color-schemes" content="dark">');
    expect(templates).toContain("background-image:linear-gradient(${BG},${BG})");
  });
});
