import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata = { title: 'Termos de Uso — Fiel Rio Pardo', description: 'Termos de Uso, Regras do Bolão e condições de participação.' };

export default function TermosPage() {
  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 text-gray-300">
        <h1 className="text-3xl font-black text-[#C8A951] mb-2">Termos de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: abril de 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">1. Aceitação dos Termos</h2>
          <p>Ao se cadastrar e utilizar a plataforma <strong className="text-white">Fiel Rio Pardo</strong> (fielriopardo.com.br), você concorda integralmente com estes Termos de Uso. Caso não concorde com alguma condição, não utilize nossos serviços.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">2. Elegibilidade</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>O cadastro é permitido exclusivamente para <strong className="text-white">maiores de 18 anos</strong>.</li>
            <li>Ao se cadastrar, você declara ter 18 anos ou mais e que as informações fornecidas são verdadeiras.</li>
            <li>Contas de menores de idade serão canceladas imediatamente.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">3. O Bolão — Regras Gerais</h2>
          <p className="mb-3">O Bolão Fiel Rio Pardo é uma atividade recreativa entre membros da torcida organizada. <strong className="text-white">Não envolve apostas ou dinheiro de forma individual</strong> — eventuais premiações são custeadas pela associação.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cada participante faz um palpite de placar (gols do Corinthians × gols do adversário) para cada jogo.</li>
            <li>Os palpites ficam abertos até <strong className="text-white">1 minuto antes</strong> do início da partida.</li>
            <li>É permitido alterar o palpite enquanto o bolão estiver aberto.</li>
            <li>Palpites não realizados dentro do prazo não são computados — valem 0 pontos.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">4. Pontuação</h2>
          <div className="bg-[#1a1a1a] border border-[#3d3d3d] rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
              <span>Acertou o placar <strong className="text-white">sozinho</strong></span>
              <span className="text-[#C8A951] font-bold text-lg">2 pontos</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
              <span>Acertou o placar <strong className="text-white">junto com outros</strong></span>
              <span className="text-[#C8A951] font-bold text-lg">1 ponto</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Errou o placar</span>
              <span className="text-gray-500 font-bold text-lg">0 pontos</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">A pontuação de cada rodada é somada ao total da temporada. O ranking é atualizado automaticamente após cada jogo.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">5. Premiação</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Os prêmios são definidos pela diretoria da Fiel Rio Pardo ao início de cada temporada.</li>
            <li>Os prêmios são entregues ao final da temporada (após a última rodada do Brasileirão).</li>
            <li>Em caso de empate no ranking final, critérios de desempate serão aplicados: maior número de vitórias únicas, depois maior número de vitórias totais.</li>
            <li>A premiação pode ser alterada pela diretoria com aviso prévio aos participantes.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">6. Conduta e Penalidades</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>É vedado o uso de múltiplas contas por um mesmo participante.</li>
            <li>Qualquer tentativa de manipulação do sistema resultará em banimento permanente.</li>
            <li>Comportamento desrespeitoso com outros participantes ou administradores pode resultar em suspensão.</li>
            <li>A diretoria da Fiel Rio Pardo se reserva o direito de cancelar cadastros sem aviso prévio em caso de violações.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">7. Alterações nos Termos</h2>
          <p>Estes Termos podem ser atualizados a qualquer momento. As alterações entram em vigor na data de publicação nesta página. O uso continuado da plataforma implica aceitação das novas condições.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-3">8. Contato</h2>
          <p>Dúvidas sobre estes Termos: <a href="mailto:timao@fielriopardo.com.br" className="text-[#C8A951] hover:underline">timao@fielriopardo.com.br</a></p>
        </section>

        <div className="border-t border-[#2d2d2d] pt-6 text-center text-sm text-gray-600">
          © 2026 Fiel Rio Pardo — Torcida Organizada do Corinthians, São José do Rio Pardo/SP<br/>
          <a href="/privacidade" className="text-[#C8A951] hover:underline mt-1 inline-block">Política de Privacidade</a>
        </div>
      </main>
      <Footer />
    </>
  );
}
