content_to_add = "\n  async sendPasswordReset(user: User, token: string): Promise<void> {\n    const link = `https://fielriopardo.com.br/bolao/redefinir-senha?token=${token}`;\n    const emailContent = `\n      <h2 style=\"color:#C8A951;text-align:center;margin:0 0 16px\">Redefini\u00e7\u00e3o de Senha</h2>\n      <p style=\"color:#ccc;line-height:1.6\">Ol\u00e1, <strong style=\"color:#fff\">${user.nick}</strong>!</p>\n      <p style=\"color:#ccc;line-height:1.6\">Recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta.</p>\n      <p style=\"color:#ccc;line-height:1.6\">Clique no bot\u00e3o abaixo para criar uma nova senha. O link expira em <strong style=\"color:#fff\">2 horas</strong>.</p>\n      <div style=\"text-align:center;margin:24px 0\">\n        <a href=\"${link}\" style=\"display:inline-block;background:#C8A951;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:16px\">Redefinir Minha Senha</a>\n      </div>\n      <p style=\"color:#666;font-size:12px;text-align:center\">Se voc\u00ea n\u00e3o solicitou a redefini\u00e7\u00e3o, ignore este e-mail.</p>\n    `;\n    const html = this.baseTemplate(emailContent);\n    await this.send(user.email, \"\U0001f510 Redefini\u00e7\u00e3o de Senha \u2014 Fiel Rio Pardo\", html);\n  }\n"

with open("/opt/fielriopardo/backend/src/email/email.service.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.rstrip()
if content.endswith("}"):
    content = content[:-1] + content_to_add + "}"
with open("/opt/fielriopardo/backend/src/email/email.service.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Done email.service.ts - sendPasswordReset added")
