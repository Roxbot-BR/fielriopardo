"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Save, Eye, EyeOff } from "lucide-react";

interface Setting { key: string; value: string; description?: string; category: string; }
interface SettingKey { key: string; label: string; secret: boolean; placeholder: string; }
interface ProviderOption { value: string; label: string; }
interface SettingSection {
  title: string;
  category: string;
  providerOptions?: ProviderOption[];
  keys: SettingKey[];
}

const SECTIONS: SettingSection[] = [
  {
    title: "🤖 Inteligência Artificial (Claude / OpenAI)",
    category: "ai",
    providerOptions: [
      { value: "claude", label: "Utilizar Claude API" },
      { value: "openai", label: "Utilizar OpenAI API" },
    ],
    keys: [
      { key: "anthropic_api_key", label: "Anthropic API Key", secret: true, placeholder: "sk-ant-..." },
      { key: "anthropic_model", label: "Modelo Claude", secret: false, placeholder: "claude-opus-4-5" },
      { key: "openai_api_key", label: "OpenAI API Key", secret: true, placeholder: "sk-..." },
      { key: "openai_model", label: "Modelo OpenAI", secret: false, placeholder: "gpt-..." },
    ],
  },
  {
    title: "📧 Configurações de E-mail (SMTP)",
    category: "email",
    keys: [
      { key: "smtp_host",           label: "Servidor SMTP",        secret: false, placeholder: "smtp.gmail.com" },
      { key: "smtp_port",           label: "Porta SMTP",           secret: false, placeholder: "587" },
      { key: "smtp_user",           label: "Usuário SMTP",         secret: false, placeholder: "noreply@fielriopardo.com.br" },
      { key: "smtp_pass",           label: "Senha SMTP",           secret: true,  placeholder: "senha ou app-password" },
      { key: "smtp_from_name",      label: "Nome do Remetente",    secret: false, placeholder: "Fiel Rio Pardo" },
      { key: "smtp_from_email",     label: "E-mail Remetente",     secret: false, placeholder: "noreply@fielriopardo.com.br" },
      { key: "email_welcome_enabled",    label: "Boas-vindas ao cadastrar",        secret: false, placeholder: "true" },
      { key: "email_bolao_open_enabled", label: "Notificar abertura do bolão",     secret: false, placeholder: "true" },
      { key: "email_result_enabled",     label: "Enviar resultado pós-jogo",       secret: false, placeholder: "true" },
    ],
  },
  {
    title: "⚽ Regras do Bolão",
    category: "bolao",
    keys: [
      { key: "bolao_season",               label: "Temporada atual",              secret: false, placeholder: "2026" },
      { key: "bolao_close_minutes_before", label: "Fechar bolão X min antes",     secret: false, placeholder: "1" },
      { key: "prize_1st",                  label: "1º Prêmio",                    secret: false, placeholder: "R$ 150,00" },
      { key: "prize_2nd",                  label: "2º Prêmio",                    secret: false, placeholder: "Camisa do Timão" },
      { key: "prize_3rd",                  label: "3º Prêmio",                    secret: false, placeholder: "Kit Presente do Timão" },
    ],
  },
  {
    title: "📱 Redes Sociais",
    category: "social",
    keys: [
      { key: "instagram_url", label: "URL Instagram", secret: false, placeholder: "https://instagram.com/fielriopardo" },
      { key: "facebook_url",  label: "URL Facebook",  secret: false, placeholder: "https://facebook.com/fielriopardo" },
      { key: "radio_url",     label: "URL Rádio",     secret: false, placeholder: "http://radiocoringao.com.br" },
    ],
  },
];

export default function MasterSettingsPage() {
  const { isMaster, isLoading } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [hidden,  setHidden] = useState<Record<string, boolean>>({});
  const [saving,  setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!isLoading && !isMaster) router.push("/"); }, [isLoading, isMaster, router]);

  useEffect(() => {
    api.get<Setting[]>("/settings").then(({ data }) => {
      const map: Record<string, string> = {};
      data.forEach((s) => (map[s.key] = s.value ?? ""));
      if (!map.ai_provider) map.ai_provider = "claude";
      setValues(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/settings", { ...values, ai_provider: values.ai_provider || "claude" });
      toast.success("✅ Configurações salvas!");
    } catch { toast.error("Erro ao salvar configurações"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gold mb-8">⚙️ Configurações do Sistema</h1>
      <form onSubmit={save} className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.category} className="bg-dark rounded-xl border border-dark-3 overflow-hidden">
            <div className="bg-dark-2 px-5 py-3 border-b border-dark-3">
              <h2 className="font-semibold text-white">{section.title}</h2>
            </div>
            <div className="p-5 space-y-4">
              {section.providerOptions && (
                <div>
                  <span className="text-sm text-gray-400 block mb-2">API habilitada</span>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {section.providerOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 bg-dark-3 border border-dark-3 rounded-lg px-3 py-2 text-sm text-white cursor-pointer hover:border-gold transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={(values.ai_provider || "claude") === option.value}
                          onChange={() => setValues((p) => ({ ...p, ai_provider: option.value }))}
                          className="h-4 w-4 accent-gold"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {section.keys.map((item) => (
                <div key={item.key}>
                  <label className="text-sm text-gray-400 block mb-1">{item.label}</label>
                  <div className="relative">
                    <input
                      type={item.secret && !hidden[item.key] ? "password" : "text"}
                      value={values[item.key] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [item.key]: e.target.value }))}
                      placeholder={item.placeholder}
                      className="w-full bg-dark-3 border border-dark-3 focus:border-gold rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors pr-10"
                    />
                    {item.secret && (
                      <button type="button" onClick={() => setHidden((p) => ({ ...p, [item.key]: !p[item.key] }))}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gold transition-colors">
                        {hidden[item.key] ? <Eye size={16}/> : <EyeOff size={16}/>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" disabled={saving}
          className="w-full bg-gold text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/> : <Save size={16}/>}
          {saving ? "Salvando..." : "Salvar Todas as Configurações"}
        </button>
      </form>
    </div>
  );
}
