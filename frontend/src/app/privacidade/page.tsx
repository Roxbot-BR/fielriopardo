import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = { title: 'Política de Privacidade — Fiel Rio Pardo', description: 'Como coletamos, usamos e protegemos seus dados pessoais.' };

export default function PrivacidadePage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-300">
        <h1 className="text-3xl font-black text-[#C8A951] mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: abril de 2026 · Em conformidade com a <strong className="text-white">LGPD</strong> (Lei nº 13.709/2018)</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">1. Controlador dos Dados</h2>
          <p>A <strong className="text-white">Fiel Rio Pardo</strong>, torcida organizada do Sport Club Corinthians Paulista, com sede em São José do Rio Pardo/SP, é a controladora dos dados pessoais coletados nesta plataforma.</p>
          <p className="mt-2">Contato DPO: <a href="mailto:timao@fielriopardo.com.br" className="text-[#C8A951] hover:underline">timao@fielriopardo.com.br</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">2. Dados Coletados</h2>
          <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#3d3d3d]"><th className="text-left p-3 text-[#C8A951]">Dado</th><th className="text-left p-3 text-[#C8A951]">Finalidade</th><th className="text-left p-3 text-[#C8A951]">Base Legal</th></tr></thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                <tr><td className="p-3">Nome completo</td><td className="p-3">Identificação</td><td className="p-3">Contrato</td></tr>
                <tr><td className="p-3">Nick (apelido)</td><td className="p-3">Ranking público</td><td className="p-3">Contrato</td></tr>
                <tr><td className="p-3">E-mail</td><td className="p-3">Comunicações, acesso</td><td className="p-3">Contrato / Legítimo interesse</td></tr>
                <tr><td className="p-3">WhatsApp</td><td className="p-3">Comunicação direta</td><td className="p-3">Consentimento</td></tr>
                <tr><td className="p-3">Data de nascimento</td><td className="p-3">Verificação de idade (18+), aniversário</td><td className="p-3">Obrigação legal / Consentimento</td></tr>
                <tr><td className="p-3">Cidade / Estado</td><td className="p-3">Estatísticas regionais</td><td className="p-3">Legítimo interesse</td></tr>
                <tr><td className="p-3">Palpites e pontuação</td><td className="p-3">Funcionamento do bolão</td><td className="p-3">Contrato</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">3. Como Usamos seus Dados</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Gestão da conta e autenticação na plataforma.</li>
            <li>Funcionamento do Bolão: registro de palpites, cálculo de pontuação e ranking.</li>
            <li>Envio de e-mails transacionais: abertura/encerramento do bolão, resultado de jogos, boas-vindas e aniversário.</li>
            <li>Verificação de maioridade (18 anos ou mais) para participação.</li>
            <li>Nunca vendemos, alugamos ou compartilhamos seus dados com terceiros para fins comerciais.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">4. Retenção dos Dados</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta, os dados pessoais identificáveis são removidos em até 30 dias, exceto aqueles que precisam ser mantidos por obrigação legal.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">5. Seus Direitos (LGPD)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Acesso:</strong> Solicitar uma cópia dos seus dados pessoais.</li>
            <li><strong className="text-white">Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li><strong className="text-white">Exclusão:</strong> Solicitar a exclusão de dados desnecessários ou excessivos.</li>
            <li><strong className="text-white">Portabilidade:</strong> Receber seus dados em formato estruturado.</li>
            <li><strong className="text-white">Revogação:</strong> Retirar consentimento a qualquer momento.</li>
          </ul>
          <p className="mt-3 text-sm">Para exercer seus direitos: <a href="mailto:timao@fielriopardo.com.br" className="text-[#C8A951] hover:underline">timao@fielriopardo.com.br</a></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">6. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados: senhas armazenadas com hash bcrypt, comunicações via HTTPS, acesso restrito por perfis de permissão.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">7. Cookies</h2>
          <p>Utilizamos apenas cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento ou publicidade.</p>
        </section>

        <div className="border-t border-[#2d2d2d] pt-6 text-center text-sm text-gray-600">
          © 2026 Fiel Rio Pardo — São José do Rio Pardo/SP<br/>
          <a href="/termos" className="text-[#C8A951] hover:underline mt-1 inline-block">Termos de Uso</a>
        </div>
      </main>
      <Footer />
    </>
  );
}
