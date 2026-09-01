'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Save, Trophy, Target, Calendar, Bell, BellOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BirthDateInput } from '@/components/ui/BirthDateInput';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

function maskWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}



const profileSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  nick:     z.string().min(2).max(20),
  whatsapp: z.string().min(14, 'WhatsApp inválido').regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (19) 99999-9999'),
  city:     z.string().min(2),
  state:    z.string().length(2),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword:     z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

type ProfileForm  = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  totalPoints: number;
  ranking: number | null;
}

interface NotifyPrefs {
  notifyBolaoOpen:  boolean;
  notifyBolaoClose: boolean;
  notifyRanking:    boolean;
  notifyBirthday:   boolean;
}

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function RoleBadge({ roles }: { roles?: string[] }) {
  if (!roles?.length) return null;
  if (roles.includes('MASTER')) return <Badge variant="gold">MASTER</Badge>;
  if (roles.includes('ADMIN'))  return <Badge variant="blue">ADMIN</Badge>;
  return <Badge variant="gray">Participante</Badge>;
}

/* ── Toggle Switch component ──────────────────────────────── */
function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C8A951] focus:ring-offset-2 focus:ring-offset-black ${
        checked ? 'bg-[#C8A951] border-[#C8A951]' : 'bg-gray-700 border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function PerfilPage() {
  const { user, token } = useAuth();
  const [stats, setStats]           = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]     = useState(false);
  const [savingNotify, setSavingNotify] = useState(false);

  const [notify, setNotify] = useState<NotifyPrefs>({
    notifyBolaoOpen:  true,
    notifyBolaoClose: true,
    notifyRanking:    true,
    notifyBirthday:   true,
  });

  const profileForm  = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      fullName: user.fullName ?? '',
      nick:     user.nick     ?? '',
      whatsapp: user.whatsapp ?? '',
      city:     user.city     ?? '',
      state:    user.state    ?? '',
    });
    // Load notification prefs (default to true if not set)
    setNotify({
      notifyBolaoOpen:  user.notifyBolaoOpen  ?? true,
      notifyBolaoClose: user.notifyBolaoClose ?? true,
      notifyRanking:    user.notifyRanking    ?? true,
      notifyBirthday:   user.notifyBirthday   ?? true,
    });
  }, [user]);

  useEffect(() => {
    if (!token) return;
    const year = new Date().getFullYear();
    Promise.all([
      api.get('/bolao/ranking?season=' + year).catch(() => ({ data: [] })),
      api.get('/bolao/predictions/me').catch(() => ({ data: [] })),
    ]).then(([rankRes, predRes]) => {
      const ranking = (rankRes.data as Array<{ userId: string; rank: number; totalPoints: number }>);
      const myRank  = ranking.find((r) => r.userId === user?.id);
      const preds   = (predRes.data as Array<{ points?: number }>) || [];
      const correct = preds.filter((p) => (p.points ?? 0) > 0).length;
      setStats({
        totalPredictions: preds.length,
        correctPredictions: correct,
        totalPoints: myRank?.totalPoints ?? 0,
        ranking: myRank?.rank ?? null,
      });
    }).finally(() => setLoadingStats(false));
  }, [token, user?.id]);

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      await api.patch('/users/me', data);
      const stored = localStorage.getItem('fiel_user');
      if (stored) {
        const u = JSON.parse(stored);
        Object.assign(u, data);
        localStorage.setItem('fiel_user', JSON.stringify(u));
      }
      toast.success('Perfil atualizado! ✅');
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPw(true);
    try {
      await api.post('/users/me/change-password', {
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      });
      toast.success('Senha alterada! 🎉');
      passwordForm.reset();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Senha atual incorreta');
    } finally {
      setSavingPw(false);
    }
  };

  const onSaveNotify = async () => {
    setSavingNotify(true);
    try {
      await api.patch('/users/me', notify);
      // Persist in localStorage
      const stored = localStorage.getItem('fiel_user');
      if (stored) {
        const u = JSON.parse(stored);
        Object.assign(u, notify);
        localStorage.setItem('fiel_user', JSON.stringify(u));
      }
      toast.success('Preferências de e-mail salvas! 📬');
    } catch {
      toast.error('Erro ao salvar preferências');
    } finally {
      setSavingNotify(false);
    }
  };

  const toggleNotify = (key: keyof NotifyPrefs) => {
    setNotify(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Avatar + nome */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C8A951] to-[#8b7535] flex items-center justify-center text-2xl font-black text-black select-none">
            {(user.nick ?? user.fullName ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 text-sm">@{user.nick}</span>
              <RoleBadge roles={user.roles as string[]} />
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loadingStats && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Trophy,   label: 'Pontos',   value: stats.totalPoints,        color: 'bg-[#C8A951]/20 text-[#C8A951]' },
              { icon: Target,   label: 'Palpites', value: stats.totalPredictions,   color: 'bg-blue-500/20 text-blue-400' },
              { icon: Calendar, label: 'Acertos',  value: stats.correctPredictions, color: 'bg-[#C8A951]/20 text-[#C8A951]' },
              { icon: Trophy,   label: 'Ranking',  value: stats.ranking ? `#${stats.ranking}` : '-', color: 'bg-purple-500/20 text-purple-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <Card key={label} variant="default">
                <CardContent className="p-4 flex flex-col items-center gap-1 text-center">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-xl font-black text-white">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dados pessoais */}
        <Card variant="highlight" className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
              <User size={18} className="text-[#C8A951]" /> Dados Pessoais
            </h2>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nome Completo" placeholder="João da Silva"
                  error={profileForm.formState.errors.fullName?.message}
                  {...profileForm.register('fullName')} />
                <Input label="Nick / Apelido" placeholder="Fiel123"
                  error={profileForm.formState.errors.nick?.message}
                  {...profileForm.register("nick")} />
              </div>
              <div className="flex flex-col gap-1">
                <BirthDateInput
                  label="Data de Nascimento"
                  value={user?.birthDate ? user.birthDate.slice(0, 10) : ''}
                  onChange={() => {}}
                  readOnly
                  maxAge={0}
                />
                <p className="text-xs text-gray-500">Somente administradores podem alterar a data de nascimento.</p>
              </div>
              <Input label="WhatsApp" type="tel" placeholder="(19) 99999-9999"
                error={profileForm.formState.errors.whatsapp?.message}
                {...profileForm.register("whatsapp")}
                onChange={(e) => {
                  const masked = maskWhatsapp(e.target.value);
                  e.target.value = masked;
                  profileForm.setValue("whatsapp", masked, { shouldValidate: true });
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" placeholder="São José do Rio Pardo"
                  error={profileForm.formState.errors.city?.message}
                  {...profileForm.register('city')} />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-300">Estado</label>
                  <select className="h-10 rounded-md border border-[#3d3d3d] bg-[#1a1a1a] px-3 text-sm text-white focus:border-[#C8A951] focus:outline-none"
                    {...profileForm.register('state')}>
                    <option value="">UF</option>
                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-300">E-mail</label>
                <input readOnly value={user.email ?? ''} className="h-10 rounded-md border border-[#2d2d2d] bg-[#111] px-3 text-sm text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-600">E-mail não pode ser alterado aqui</p>
              </div>
              <Button type="submit" className="w-fit" disabled={savingProfile}>
                <Save size={15} className="mr-1" />
                {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notificações por e-mail */}
        <Card variant="default" className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Bell size={18} className="text-[#C8A951]" /> Notificações por E-mail
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Escolha quais avisos você deseja receber em <span className="text-gray-400">{user.email}</span>
            </p>

            <div className="space-y-4">
              {[
                {
                  key: 'notifyBolaoOpen' as keyof NotifyPrefs,
                  icon: '🔓',
                  title: 'Bolão Aberto',
                  desc: 'Aviso quando o bolão de um novo jogo estiver disponível para palpites',
                },
                {
                  key: 'notifyBolaoClose' as keyof NotifyPrefs,
                  icon: '🔒',
                  title: 'Bolão Encerrado',
                  desc: 'Aviso quando o prazo para palpites se encerrar (1 minuto antes do jogo)',
                },
                {
                  key: 'notifyRanking' as keyof NotifyPrefs,
                  icon: '🏆',
                  title: 'Classificação Pós-Jogo',
                  desc: 'Receba o resultado do bolão e sua posição no ranking após cada partida',
                },
                {
                  key: 'notifyBirthday' as keyof NotifyPrefs,
                  icon: '🎂',
                  title: 'Parabéns de Aniversário',
                  desc: 'Receba uma mensagem especial da Fiel Rio Pardo no seu aniversário',
                },
              ].map(({ key, icon, title, desc }) => (
                <div
                  key={key}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                    notify[key]
                      ? 'border-[#C8A951]/30 bg-[#C8A951]/5'
                      : 'border-[#2d2d2d] bg-[#0d0d0d]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{icon}</span>
                    <div>
                      <p className={`font-semibold text-sm ${notify[key] ? 'text-white' : 'text-gray-400'}`}>
                        {title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {notify[key]
                      ? <Bell size={14} className="text-[#C8A951]" />
                      : <BellOff size={14} className="text-gray-600" />
                    }
                    <Toggle checked={notify[key]} onChange={() => toggleNotify(key)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                {Object.values(notify).filter(Boolean).length === 0
                  ? '🔕 Todas as notificações desativadas'
                  : `📬 ${Object.values(notify).filter(Boolean).length} notificação(ões) ativa(s)`
                }
              </p>
              <Button type="button" variant="outline" className="w-fit" disabled={savingNotify} onClick={onSaveNotify}>
                <Save size={15} className="mr-1" />
                {savingNotify ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trocar senha */}
        <Card variant="default">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
              <Lock size={18} className="text-[#C8A951]" /> Alterar Senha
            </h2>
            <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="flex flex-col gap-4">
              <Input label="Senha Atual" type="password" autoComplete="current-password" placeholder="••••••••"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')} />
              <Input label="Nova Senha (mínimo 8 caracteres)" type="password" autoComplete="new-password" placeholder="••••••••"
                error={passwordForm.formState.errors.newPassword?.message}
                {...passwordForm.register('newPassword')} />
              <Input label="Confirmar Nova Senha" type="password" autoComplete="new-password" placeholder="••••••••"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')} />
              <Button type="submit" variant="outline" className="w-fit" disabled={savingPw}>
                <Lock size={15} className="mr-1" />
                {savingPw ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </main>
      <Footer />
    </>
  );
}
