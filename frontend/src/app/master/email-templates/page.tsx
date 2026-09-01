"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Save, RefreshCw, Eye, EyeOff, Mail, RotateCcw } from "lucide-react";

interface Template {
  key: string;
  subject: string | null;
  html: string | null;
  hasCustom: boolean;
}

interface EmailStats {
  total: number;
  todayCount: number;
  sent: number;
  failed: number;
  opened: number;
  byType: { type: string; count: string; failed: string; opened: string }[];
  recent: { id: string; toEmail: string; toName?: string; subject: string; type: string; status: string; opened: boolean; createdAt: string }[];
}

const TEMPLATE_META: Record<string, { label: string; icon: string; defaultSubject: string }> = {
  "welcome":      { label: "Boas-vindas ao Bolão",  icon: "🎉", defaultSubject: "🦅 Bem-vindo ao Bolão Fiel Rio Pardo!" },
  "bolao-open":   { label: "Bolão Aberto",          icon: "⚽", defaultSubject: "⚽ Bolão aberto: {{home}} x {{away}}" },
  "match-result": { label: "Resultado do Jogo",     icon: "🏁", defaultSubject: "🏁 Resultado: {{home}} {{hscore}}x{{ascore}} {{away}}" },
  "birthday":     { label: "Feliz Aniversário",      icon: "🎂", defaultSubject: "🎂 Feliz Aniversário, {{nick}}! 🖤🤍" },
};

const DEFAULT_HTML: Record<string, string> = {
  "welcome": `<h2>🎉 Bem-vindo ao Bolão, {{nick}}!</h2>
<p>Olá <strong>{{fullName}}</strong>, seu cadastro foi realizado com sucesso!</p>
<div class="box">
  <div class="gold">Seus dados de acesso:</div>
  <p>📧 E-mail: <strong>{{email}}</strong></p>
  <p>🎯 Nick: <strong>{{nick}}</strong></p>
</div>
<h2>🏆 Prêmios da Temporada</h2>
<div class="box">
  <p>🥇 1º Lugar: <strong class="gold">{{prize1}}</strong></p>
  <p>🥈 2º Lugar: <strong>{{prize2}}</strong></p>
  <p>🥉 3º Lugar: <strong>{{prize3}}</strong></p>
</div>
<div style="text-align:center"><a href="https://fielriopardo.com.br/bolao" class="btn">⚽ Acessar o Bolão</a></div>`,
  "bolao-open": `<h2>⚽ Bolão Aberto — Dê seu Palpite!</h2>
<div class="box" style="border-color:#C8A951">
  <div style="text-align:center;font-size:20px;font-weight:bold;margin-bottom:12px">
    {{home}} <span class="gold">X</span> {{away}}
  </div>
  <p>📆 {{date}}</p>
  <p>🕒 {{time}} hrs</p>
  <p>🏆 {{competition}}</p>
</div>
<p style="color:#888">⚠️ O bolão encerra <strong style="color:#fff">1 minuto antes</strong> do início da partida.</p>
<div style="text-align:center"><a href="https://fielriopardo.com.br/bolao/jogo/{{matchId}}" class="btn">🎯 Dar Meu Palpite</a></div>`,
  "match-result": `<h2>🏁 Resultado do Jogo</h2>
<div class="box" style="text-align:center;border-color:#C8A951">
  <div style="font-size:18px;font-weight:bold">{{home}} <span class="gold">{{hscore}} x {{ascore}}</span> {{away}}</div>
  <div style="color:#888;font-size:13px;margin-top:4px">{{competition}}</div>
</div>
<h2>🎯 Acertadores</h2>
<p>{{winners}}</p>
<h2>🏆 Classificação Atual</h2>
<p>{{ranking}}</p>
<div style="text-align:center;margin-top:16px"><a href="https://fielriopardo.com.br/bolao/ranking" class="btn">📊 Ver Classificação</a></div>`,
  "birthday": `<h2 style="text-align:center;font-size:28px;border:none">🎂🖤🤍🎂</h2>
<h2 style="text-align:center">Feliz Aniversário, {{nick}}!</h2>
<p style="text-align:center;font-size:16px">A <strong class="gold">Fiel Rio Pardo</strong> deseja a você um dia repleto de alegria, saúde e muito Corinthians!</p>
<div class="box" style="text-align:center;border-color:#C8A951;padding:24px">
  <div style="font-size:48px">🦅</div>
  <p style="font-size:18px;margin:8px 0"><strong>Que hoje seja tão especial</strong></p>
  <p style="color:#888">quanto a sensação de ver o Timão campeão!</p>
</div>
<div style="text-align:center;padding:16px 0">
  <p style="color:#C8A951;font-size:20px;font-weight:bold">🖤 Vai Corinthians! 🤍</p>
  <p style="color:#888;font-size:13px">Com carinho, toda a torcida Fiel Rio Pardo</p>
</div>
<div style="text-align:center"><a href="https://fielriopardo.com.br/bolao" class="btn">⚽ Acessar o Bolão</a></div>`,
};

const BASE_WRAPPER = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{margin:0;padding:0;background:#000;font-family:Arial,sans-serif;color:#fff}
.wrap{max-width:600px;margin:0 auto;background:#1a1a1a;border:2px solid #C8A951;border-radius:12px;overflow:hidden}
.header{background:#000;padding:20px 16px 16px;text-align:center;border-bottom:2px solid #C8A951}
.logo-img{width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px}
.brand{font-size:20px;font-weight:bold;color:#C8A951;letter-spacing:1px}
.body{padding:28px}
h2{color:#C8A951;border-bottom:1px solid #333;padding-bottom:8px}
.box{background:#2d2d2d;border:1px solid #3d3d3d;border-radius:8px;padding:16px;margin:12px 0}
.gold{color:#C8A951;font-weight:bold}
.btn{display:inline-block;background:#C8A951;color:#000;padding:12px 28px;border-radius:8px;font-weight:bold;text-decoration:none;margin:16px 0}
.footer{background:#000;padding:16px;text-align:center;color:#555;font-size:12px;border-top:1px solid #333}
</style></head><body>
<div class="wrap">
  <div class="header">
    <img src="https://fielriopardo.com.br/logo.jpeg" alt="Fiel Rio Pardo" style="width:80px;height:80px;border-radius:50%;border:3px solid #C8A951;object-fit:cover;display:block;margin:0 auto 12px">
    <div class="brand">Fiel Rio Pardo</div>
    <div style="color:#888;font-size:12px">Torcida Organizada do Corinthians — São José do Rio Pardo/SP</div>
  </div>
  <div class="body">CONTENT_HERE</div>
  <div class="footer">© 2026 Fiel Rio Pardo · <a href="https://fielriopardo.com.br" style="color:#C8A951">fielriopardo.com.br</a></div>
</div></body></html>`;

export default function EmailTemplatesPage() {
  const { isMaster, isLoading } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<string>("welcome");
  const [html, setHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isLoading && !isMaster) router.push("/");
  }, [isMaster, isLoading]);

  useEffect(() => { loadTemplates(); loadStats(); }, []);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const res = await api.get<EmailStats>('/email/stats');
      setStats(res.data);
    } catch { /* stats optional */ }
    finally { setLoadingStats(false); }
  }

  async function loadTemplates() {
    try {
      const res = await api.get<Template[]>("/master/email-templates");
      setTemplates(res.data);
      selectTemplate(selected, res.data);
    } catch { toast.error("Erro ao carregar templates"); }
  }

  function selectTemplate(key: string, tpls?: Template[]) {
    const list = tpls ?? templates;
    const tpl = list.find(t => t.key === key);
    setSelected(key);
    setHtml(tpl?.html || DEFAULT_HTML[key] || "");
    setSubject(tpl?.subject || TEMPLATE_META[key]?.defaultSubject || "");
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/master/email-templates/${selected}`, { subject, html });
      toast.success("Template salvo!");
      loadTemplates();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function reset() {
    if (!confirm("Restaurar o template padrão?")) return;
    try {
      await api.delete(`/master/email-templates/${selected}`);
      setHtml(DEFAULT_HTML[selected] || "");
      setSubject(TEMPLATE_META[selected]?.defaultSubject || "");
      toast.success("Template restaurado ao padrão!");
      loadTemplates();
    } catch { toast.error("Erro ao restaurar"); }
  }

  async function sendTest() {
    try {
      await api.post(`/master/email-templates/${selected}/test`);
      toast.success("E-mail de teste enviado!");
    } catch { toast.error("Erro ao enviar teste"); }
  }

  const previewHtml = BASE_WRAPPER.replace("CONTENT_HERE", html);

  if (isLoading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="text-yellow-400" size={28} />
          <h1 className="text-2xl font-bold text-yellow-400">Templates de E-mail</h1>
        </div>

        {/* Email Stats Card */}
        {stats && (
          <div className="mb-6 bg-[#111] border border-[#2d2d2d] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#C8A951] uppercase tracking-wider mb-4">Estatísticas de Envio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#C8A951]">{stats.todayCount}</div>
                <div className="text-xs text-gray-400 mt-1">Enviadas Hoje</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-400 mt-1">Total Enviadas</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.sent}</div>
                <div className="text-xs text-gray-400 mt-1">Entregues</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-xs text-gray-400 mt-1">Falhas</div>
              </div>
              <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.opened}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Abertas {stats.sent > 0 ? `(${Math.round((stats.opened / stats.sent) * 100)}%)` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Por Tipo */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Por Tipo</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#2d2d2d]">
                        <th className="text-left py-1.5 text-[#C8A951]">Tipo</th>
                        <th className="text-right py-1.5 text-[#C8A951]">Total</th>
                        <th className="text-right py-1.5 text-red-400">Falhas</th>
                        <th className="text-right py-1.5 text-blue-400">Abertas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byType.map(row => (
                        <tr key={row.type} className="border-b border-[#1a1a1a]">
                          <td className="py-1.5 text-gray-300">{row.type}</td>
                          <td className="py-1.5 text-right text-white">{row.count}</td>
                          <td className="py-1.5 text-right text-red-400">{row.failed}</td>
                          <td className="py-1.5 text-right text-blue-400">{row.opened}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Últimas 20 */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Últimas 20</h3>
                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#111]">
                      <tr className="border-b border-[#2d2d2d]">
                        <th className="text-left py-1.5 text-[#C8A951]">Para</th>
                        <th className="text-left py-1.5 text-[#C8A951]">Tipo</th>
                        <th className="text-center py-1.5 text-[#C8A951]">Status</th>
                        <th className="text-center py-1.5 text-[#C8A951]">Aberto</th>
                        <th className="text-right py-1.5 text-[#C8A951]">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.map(r => (
                        <tr key={r.id} className="border-b border-[#1a1a1a]">
                          <td className="py-1 text-gray-300 truncate max-w-[120px]">{r.toEmail}</td>
                          <td className="py-1 text-gray-400">{r.type}</td>
                          <td className="py-1 text-center">
                            <span className={r.status === 'sent' ? 'text-green-400' : 'text-red-400'}>
                              {r.status === 'sent' ? '✓' : '✗'}
                            </span>
                          </td>
                          <td className="py-1 text-center">{r.opened ? '👁' : '—'}</td>
                          <td className="py-1 text-right text-gray-500">
                            {new Date(r.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template list */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Templates</h2>
            {Object.entries(TEMPLATE_META).map(([key, meta]) => {
              const tpl = templates.find(t => t.key === key);
              return (
                <button
                  key={key}
                  onClick={() => selectTemplate(key)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected === key
                      ? "bg-yellow-400/10 border-yellow-400 text-yellow-400"
                      : "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div className="font-medium">{meta.icon} {meta.label}</div>
                  <div className={`text-xs mt-1 ${tpl?.hasCustom ? "text-green-400" : "text-gray-500"}`}>
                    {tpl?.hasCustom ? "✏️ Personalizado" : "📋 Padrão"}
                  </div>
                </button>
              );
            })}

            <div className="mt-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 font-semibold mb-2">Variáveis disponíveis</div>
              {selected === "welcome" && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div><code className="text-yellow-400">{`{{nick}}`}</code> Nick</div>
                  <div><code className="text-yellow-400">{`{{fullName}}`}</code> Nome</div>
                  <div><code className="text-yellow-400">{`{{email}}`}</code> E-mail</div>
                  <div><code className="text-yellow-400">{`{{prize1}}`}</code> 1º prêmio</div>
                </div>
              )}
              {selected === "bolao-open" && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div><code className="text-yellow-400">{`{{home}}`}</code> Time casa</div>
                  <div><code className="text-yellow-400">{`{{away}}`}</code> Time visitante</div>
                  <div><code className="text-yellow-400">{`{{date}}`}</code> Data</div>
                  <div><code className="text-yellow-400">{`{{time}}`}</code> Horário</div>
                  <div><code className="text-yellow-400">{`{{competition}}`}</code> Competição</div>
                </div>
              )}
              {selected === "match-result" && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div><code className="text-yellow-400">{`{{home}}`}</code> Time casa</div>
                  <div><code className="text-yellow-400">{`{{hscore}}`}</code> Gols casa</div>
                  <div><code className="text-yellow-400">{`{{ascore}}`}</code> Gols visitante</div>
                  <div><code className="text-yellow-400">{`{{winners}}`}</code> Acertadores</div>
                  <div><code className="text-yellow-400">{`{{ranking}}`}</code> Classificação</div>
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {TEMPLATE_META[selected]?.icon} {TEMPLATE_META[selected]?.label}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    showPreview ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-600 text-gray-300"
                  }`}
                >
                  {showPreview ? <EyeOff size={16}/> : <Eye size={16}/>}
                  {showPreview ? "Ocultar Preview" : "Preview"}
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-300 hover:border-gray-400"
                >
                  <RotateCcw size={16}/> Restaurar padrão
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold text-sm hover:bg-yellow-300 disabled:opacity-50"
                >
                  <Save size={16}/> {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Assunto do e-mail</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-400 outline-none"
                placeholder="Assunto do e-mail..."
              />
            </div>

            {showPreview ? (
              <div>
                <div className="text-xs text-gray-400 mb-2">Preview (HTML renderizado)</div>
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  className="w-full border border-gray-700 rounded-lg bg-white"
                  style={{ height: "600px" }}
                  title="Email Preview"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  HTML do corpo do e-mail <span className="text-gray-600">(sem o wrapper externo)</span>
                </label>
                <textarea
                  value={html}
                  onChange={e => setHtml(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-yellow-400 outline-none resize-none"
                  rows={20}
                  placeholder="HTML do conteúdo do e-mail..."
                  spellCheck={false}
                />
                <p className="text-xs text-gray-600 mt-1">
                  O wrapper externo (cabeçalho, rodapé, estilos) é aplicado automaticamente pelo sistema.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
