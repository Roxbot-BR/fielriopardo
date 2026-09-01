'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Tabs from '@radix-ui/react-tabs';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BirthDateInput } from '@/components/ui/BirthDateInput';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import api from '@/lib/api';

function maskWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}



const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const detailsSchema = z.object({
  fullName: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
  birthDate: z.string().min(1, 'Informe sua data de nascimento'),
  whatsapp: z.string().min(14, 'WhatsApp inválido').regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (19) 99999-9999'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().length(2, 'Selecione o estado'),
  acceptTerms: z.boolean().refine(v => v === true, { message: 'Você deve aceitar os termos para continuar' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
}).refine((d) => {
  if (!d.birthDate) return false;
  const birth = new Date(d.birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear() -
    (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return age >= 18;
}, { message: 'Você precisa ter 18 anos ou mais para participar', path: ['birthDate'] });

type LoginForm = z.infer<typeof loginSchema>;
type DetailsForm = z.infer<typeof detailsSchema>;

interface NickOption { id: string; nick: string; }

function getRedirectPath(user: User, fallbackRedirect: string | null): string {
  const roles: string[] = (user.roles ?? []) as string[];
  if (fallbackRedirect && fallbackRedirect.startsWith('/') && !fallbackRedirect.includes('//')) {
    return fallbackRedirect;
  }
  if (roles.includes('MASTER')) return '/master';
  if (roles.includes('ADMIN')) return '/admin';
  return '/bolao';
}

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function StepChoose({ onChoose }: { onChoose: (type: 'claim' | 'new') => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-white text-center mb-2">Escolha como se cadastrar</h2>
      <button
        onClick={() => onChoose('claim')}
        className="flex flex-col items-start gap-1 rounded-xl border border-[#3d3d3d] bg-[#1a1a1a] hover:border-[#C8A951] hover:bg-[#1f1e18] transition-all p-4 text-left"
      >
        <span className="text-2xl">🎖️</span>
        <span className="font-bold text-white">Já participo do Bolão</span>
        <span className="text-sm text-gray-400">Estou na lista de participantes, quero reclamar meu nick</span>
      </button>
      <button
        onClick={() => onChoose('new')}
        className="flex flex-col items-start gap-1 rounded-xl border border-[#3d3d3d] bg-[#1a1a1a] hover:border-[#C8A951] hover:bg-[#1f1e18] transition-all p-4 text-left"
      >
        <span className="text-2xl">✨</span>
        <span className="font-bold text-white">Sou novo participante</span>
        <span className="text-sm text-gray-400">Quero criar um nick novo e entrar no bolão</span>
      </button>
    </div>
  );
}

function StepPickNick({
  onSelect, onSwitchToNew, selectedId
}: {
  onSelect: (item: NickOption) => void;
  onSwitchToNew: () => void;
  selectedId: string | null;
}) {
  const [nicks, setNicks] = useState<NickOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/available-nicks').then(r => {
      setNicks(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-white text-center">Escolha seu nick na lista abaixo</h2>
      <p className="text-xs text-gray-400 text-center">Ordenado por pontuação no ranking</p>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Carregando...</div>
      ) : (
        <div
          className="grid grid-cols-2 gap-2 overflow-y-auto pr-1"
          style={{ maxHeight: '300px' }}
        >
          {nicks.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`w-full min-w-0 rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left ${
                selectedId === item.id
                  ? 'border-[#C8A951] bg-[#2a2510] text-[#C8A951]'
                  : 'border-[#3d3d3d] bg-[#1a1a1a] text-gray-300 hover:border-[#C8A951]/50 hover:text-white'
              }`}
            >
              <span className="block truncate">{item.nick}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={onSwitchToNew}
        className="text-sm text-[#C8A951] hover:underline text-center mt-1"
      >
        Novo Nick? Criar um diferente →
      </button>
    </div>
  );
}

function StepNewNick({
  value, onChange, onBack, onStatusChange
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onStatusChange?: (s: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'reserved'>('idle');

  const checkNick = useCallback(
    debounce(async (nick: string) => {
      if (!nick || nick.length < 2) { setStatus('idle'); return; }
      setStatus('checking');
      try {
        const r = await api.get(`/auth/check-nick?nick=${encodeURIComponent(nick)}`);
        if (r.data.available) { setStatus('available'); onStatusChange?.('available'); }
        else if (r.data.reserved) { setStatus('reserved'); onStatusChange?.('reserved'); }
        else { setStatus('taken'); onStatusChange?.('taken'); }
      } catch {
        setStatus('idle');
      }
    }, 500),
    []
  );

  useEffect(() => {
    checkNick(value);
  }, [value, checkNick]);

  const statusIcon = status === 'checking' ? '⏳' : status === 'available' ? '✅' : (status === 'taken' || status === 'reserved') ? '❌' : '';
  const statusText = status === 'available' ? 'Nick disponível' : status === 'taken' ? 'Nick já está em uso' : status === 'reserved' ? 'Nick reservado — use "Estou na lista"' : '';

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-white text-center">Escolha seu nick</h2>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-300">Nick (apelido)</label>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Fiel123"
          className="h-10 rounded-md border border-[#3d3d3d] bg-[#1a1a1a] px-3 text-base md:text-sm text-white focus:border-[#C8A951] focus:outline-none"
        />
        {statusIcon && (
          <p className={`text-xs flex items-center gap-1 ${status === 'available' ? 'text-green-400' : (status === 'taken' || status === 'reserved') ? 'text-red-400' : 'text-gray-400'}`}>
            {statusIcon} {statusText}
          </p>
        )}
      </div>
      <button
        onClick={onBack}
        className="text-sm text-[#C8A951] hover:underline text-left"
      >
        ← Voltar para lista
      </button>
    </div>
  );
}

function StepDetails({
  selectedNick,
  onSubmit,
  isLoading,
}: {
  selectedNick: string;
  onSubmit: (data: DetailsForm) => void;
  isLoading: boolean;
}) {
  const form = useForm<DetailsForm>({ resolver: zodResolver(detailsSchema) });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <p className="text-center text-sm text-gray-400">
        Completando cadastro para: <span className="font-bold text-[#C8A951]">{selectedNick}</span>
      </p>
      <Input label="Nome Completo" placeholder="João da Silva"
        error={form.formState.errors.fullName?.message}
        {...form.register('fullName')} />
      <Input label="E-mail" type="email" placeholder="seu@email.com"
        error={form.formState.errors.email?.message}
        {...form.register('email')} />
      <BirthDateInput
        label="Data de Nascimento"
        value={form.watch('birthDate') || ''}
        onChange={(iso) => form.setValue('birthDate', iso, { shouldValidate: true })}
        error={form.formState.errors.birthDate?.message}
        maxAge={18}
      />
      <Input label="Senha (mínimo 8 caracteres)" type="password" autoComplete="new-password" placeholder="••••••••"
        error={form.formState.errors.password?.message}
        {...form.register('password')} />
      <Input label="Confirmar Senha" type="password" autoComplete="new-password" placeholder="••••••••"
        error={form.formState.errors.confirmPassword?.message}
        {...form.register('confirmPassword')} />
      <Input label="WhatsApp" type="tel" placeholder="(19) 99999-9999"
        error={form.formState.errors.whatsapp?.message}
        {...form.register("whatsapp")}
        onChange={(e) => {
          const masked = maskWhatsapp(e.target.value);
          e.target.value = masked;
          form.setValue("whatsapp", masked, { shouldValidate: true });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Cidade" placeholder="São José do Rio Pardo"
          error={form.formState.errors.city?.message}
          {...form.register('city')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-300">Estado</label>
          <select className="h-10 rounded-md border border-[#3d3d3d] bg-[#1a1a1a] px-3 text-base md:text-sm text-white focus:border-[#C8A951] focus:outline-none"
            {...form.register('state')}>
            <option value="">UF</option>
            {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          {form.formState.errors.state && (
            <p className="text-xs text-red-400">{form.formState.errors.state.message}</p>
          )}
        </div>
      </div>
      <div className="flex items-start gap-3 mt-2">
        <input type="checkbox" id="acceptTerms" className="mt-1 h-4 w-4 accent-[#C8A951] cursor-pointer"
          {...form.register('acceptTerms')} />
        <label htmlFor="acceptTerms" className="text-sm text-gray-400 cursor-pointer leading-relaxed">
          Li e aceito os{' '}
          <a href="/termos" target="_blank" className="text-[#C8A951] hover:underline">Termos de Uso</a>
          {' '}e a{' '}
          <a href="/privacidade" target="_blank" className="text-[#C8A951] hover:underline">Política de Privacidade</a>
          {', '}confirmando que sou <strong className="text-white">maior de 18 anos</strong>.
        </label>
      </div>
      {form.formState.errors.acceptTerms && (
        <p className="text-xs text-red-400">{(form.formState.errors.acceptTerms as any).message}</p>
      )}
      <Button type="submit" size="lg" className="mt-2" disabled={isLoading}>
        {isLoading ? 'Cadastrando...' : '🦅 Criar Conta'}
      </Button>
    </form>
  );
}

function EntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login, register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);


  // Redirect is handled by explicit navigation in onLogin/onRegister handlers

  type RegStep = 'choose' | 'pick-nick' | 'new-nick' | 'details';
  const [regStep, setRegStep] = useState<RegStep>('choose');
  const [claimItem, setClaimItem] = useState<NickOption | null>(null);
  const [newNick, setNewNick] = useState('');
  const [nickStatus, setNickStatus] = useState<string>('idle');
  const [isNewPath, setIsNewPath] = useState(false);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });


  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      toast.success("Se o e-mail estiver cadastrado, você receberá um link em breve.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.error("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const user = await login(data.email, data.password);
      const roles: string[] = (user.roles ?? []) as string[];
      if (roles.includes('MASTER')) toast.success(`Bem-vindo, ${user.nick}! 🦅 Painel Master`);
      else if (roles.includes('ADMIN')) toast.success(`Bem-vindo, ${user.nick}! ⚙️ Painel Admin`);
      else toast.success('Bem-vindo de volta! 🦅');
      setTimeout(() => { window.location.href = getRedirectPath(user, redirectParam); }, 500);
    } catch {
      toast.error('E-mail ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoose = (type: 'claim' | 'new') => {
    if (type === 'claim') {
      setIsNewPath(false);
      setRegStep('pick-nick');
    } else {
      setIsNewPath(true);
      setRegStep('new-nick');
    }
  };

  const handlePickNickNext = () => {
    if (claimItem) setRegStep('details');
  };

  const handleNewNickNext = () => {
    if (newNick.trim().length >= 2) setRegStep('details');
  };

  const selectedNickLabel = isNewPath ? newNick : (claimItem?.nick ?? '');

  const onRegisterSubmit = async (data: DetailsForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _, acceptTerms: __, ...rest } = data;
      let payload: Record<string, string>;
      if (!isNewPath && claimItem) {
        payload = { ...rest, claimUserId: claimItem.id };
      } else {
        payload = { ...rest, nick: newNick.trim() };
      }
      const user = await registerUser(payload);
      toast.success('Cadastro realizado! Bem-vindo à Fiel! 🦅');
      setTimeout(() => { window.location.href = getRedirectPath(user, redirectParam); }, 800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg === 'Nick already taken') {
        toast.error('Este nick já está em uso. Se ele era seu, use "Estou na lista" para reivindicá-lo.');
      } else {
        toast.error(msg ?? 'Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetRegister = () => {
    setRegStep('choose');
    setClaimItem(null);
    setNewNick('');
    setIsNewPath(false);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-12 px-4 relative isolate [transform:translateZ(0)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center"><img src="/logo.jpeg" alt="Fiel Rio Pardo" className="w-20 h-20 object-contain rounded-full border-2 border-[#C8A951]/50" /></div>
          <h1 className="text-3xl font-black text-white">Bolão Fiel Rio Pardo</h1>
          <p className="text-gray-400 mt-2">Acesse sua conta ou crie uma nova</p>
        </div>

        <Card variant="highlight" className="bg-black/85 md:bg-black/60 backdrop-blur-none md:backdrop-blur-sm [transform:translateZ(0)] will-change-transform">
          <CardContent className="p-0">
            <Tabs.Root defaultValue="login">
              <Tabs.List className="flex border-b border-[#2d2d2d]">
                <Tabs.Trigger value="login"
                  className="flex-1 py-3 text-sm font-semibold transition-colors data-[state=active]:text-[#C8A951] data-[state=active]:border-b-2 data-[state=active]:border-[#C8A951] text-gray-400 hover:text-white rounded-tl-xl"
                  onClick={resetRegister}>
                  Entrar
                </Tabs.Trigger>
                <Tabs.Trigger value="register"
                  className="flex-1 py-3 text-sm font-semibold transition-colors data-[state=active]:text-[#C8A951] data-[state=active]:border-b-2 data-[state=active]:border-[#C8A951] text-gray-400 hover:text-white rounded-tr-xl"
                  onClick={resetRegister}>
                  Cadastrar
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="login" className="p-6">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-4">
                  <Input label="E-mail" type="email" placeholder="seu@email.com"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')} />
                  <Input label="Senha" type="password" autoComplete="current-password" placeholder="••••••••"
                    error={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")} />
                  <div className="text-right -mt-2">
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-[#C8A951] hover:underline">
                      Esqueci minha senha
                    </button>
                  </div>
                  <Button type="submit" size="lg" className="mt-2" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </Tabs.Content>

              <Tabs.Content value="register" className="p-6">
                {regStep === 'choose' && (
                  <StepChoose onChoose={handleChoose} />
                )}

                {regStep === 'pick-nick' && (
                  <div className="flex flex-col gap-3">
                    <StepPickNick
                      onSelect={setClaimItem}
                      onSwitchToNew={() => { setIsNewPath(true); setClaimItem(null); setRegStep('new-nick'); }}
                      selectedId={claimItem?.id ?? null}
                    />
                    <div className="flex gap-2 mt-1">
                      <Button variant="secondary" size="sm" onClick={() => setRegStep('choose')} className="flex-1">
                        ← Voltar
                      </Button>
                      <Button size="sm" onClick={handlePickNickNext} disabled={!claimItem} className="flex-1">
                        Próximo →
                      </Button>
                    </div>
                  </div>
                )}

                {regStep === 'new-nick' && (
                  <div className="flex flex-col gap-3">
                    <StepNewNick
                      value={newNick}
                      onChange={(v) => { setNewNick(v); setNickStatus('idle'); }}
                      onBack={() => { setIsNewPath(false); setRegStep('pick-nick'); }}
                      onStatusChange={setNickStatus}
                    />
                    <div className="flex gap-2 mt-1">
                      <Button variant="secondary" size="sm" onClick={() => setRegStep('choose')} className="flex-1">
                        ← Voltar
                      </Button>
                      <Button size="sm" onClick={handleNewNickNext} disabled={newNick.trim().length < 2 || nickStatus === 'taken' || nickStatus === 'reserved' || nickStatus === 'checking'} className="flex-1">
                        Próximo →
                      </Button>
                    </div>
                  </div>
                )}

                {regStep === 'details' && (
                  <div className="flex flex-col gap-3">
                    <button onClick={() => setRegStep(isNewPath ? 'new-nick' : 'pick-nick')}
                      className="text-sm text-[#C8A951] hover:underline text-left">
                      ← Voltar
                    </button>
                    <StepDetails
                      selectedNick={selectedNickLabel}
                      onSubmit={onRegisterSubmit}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </CardContent>
        </Card>
        <Modal open={forgotOpen} onOpenChange={setForgotOpen} title="Redefinir Senha">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-400">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            <Input label="E-mail" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="w-full h-10 rounded-md bg-[#C8A951] text-black font-bold hover:bg-[#b8993f] disabled:opacity-50 transition-colors"
            >
              {forgotLoading ? "Enviando..." : "Enviar Link"}
            </button>
          </div>
        </Modal>
      </div>
    </main>
  );
}

export default function EntrarPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="min-h-[80vh] flex items-center justify-center">
          <img src="/logo.jpeg" alt="carregando" className="w-12 h-12 object-contain rounded-full animate-pulse" />
        </main>
      }>
        <EntrarContent />
      </Suspense>
      <Footer />
    </>
  );
}
