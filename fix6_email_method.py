content_to_add = '''
  async sendPasswordReset(user: User, token: string): Promise<void> {
    const link = `https://fielriopardo.com.br/bolao/redefinir-senha?token=${token}`;
    const content = `
      <h2 style="color:#C8A951;text-align:center;margin:0 0 16px">Redefinição de Senha</h2>
      <p style="color:#ccc;line-height:1.6">Olá, <strong style="color:#fff">${user.nick}</strong>!</p>
      <p style="color:#ccc;line-height:1.6">Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p style="color:#ccc;line-height:1.6">Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#fff">2 horas</strong>.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${link}" style="display:inline-block;background:#C8A951;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:16px">Redefinir Minha Senha</a>
      </div>
      <p style="color:#666;font-size:12px;text-align:center">Se você não solicitou a redefinição, ignore este e-mail.</p>
    `;
    const html = this.baseTemplate(content);
    await this.send(user.email, '🔐 Redefinição de Senha — Fiel Rio Pardo', html);
  }
'''
print(repr(content_to_add[:100]))
