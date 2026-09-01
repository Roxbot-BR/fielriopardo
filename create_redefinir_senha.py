import os

os.makedirs("/opt/fielriopardo/frontend/src/app/bolao/redefinir-senha", exist_ok=True)

lock_emoji = "\U0001f510"
content = """'use client';
import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

const schema = z.object({
  password: z.string().min(8, 'M\u00ednimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Senhas n\u00e3o conferem', path: ['confirm'] });

type Form = z.infer<typeof schema>;

function Content() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: Form) => {
    if (!token) { toast.error('Token inv\u00e1lido.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      toast.success('Senha redefinida com sucesso!');
      router.push('/bolao/entrar');
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      toast.error(msg ?? 'Link inv\u00e1lido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#111] border-[#2a2a2a]">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <img src="/logo.jpeg" alt="Fiel Rio Pardo" className="w-16 h-16 rounded-full border-2 border-[#C8A951] object-cover mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white">Nova Senha</h1>
            <p className="text-sm text-gray-400 mt-1">Crie uma nova senha para sua conta</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Nova Senha" type="password" error={errors.password?.message} {...register('password')} />
            <Input label="Confirmar Senha" type="password" error={errors.confirm?.message} {...register('confirm')} />
            <Button type="submit" size="lg" disabled={loading || !token}>
              {loading ? 'Salvando...' : '""" + lock_emoji + """ Redefinir Senha'}
            </Button>
            {!token && <p className="text-xs text-red-400 text-center">Token n\u00e3o encontrado. Solicite um novo link.</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="min-h-[80vh] flex items-center justify-center"><div className="text-gray-400">Carregando...</div></main>}>
        <Content />
      </Suspense>
      <Footer />
    </>
  );
}
"""
with open("/opt/fielriopardo/frontend/src/app/bolao/redefinir-senha/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done redefinir-senha/page.tsx")
