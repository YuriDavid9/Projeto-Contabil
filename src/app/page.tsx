import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-16 py-10 sm:py-16">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-4 py-1.5 text-xs sm:text-sm font-bold text-indigo-700 mb-6">
          🇧🇷 Feito sob medida para MEIs, pequenas empresas e seus contadores
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Seu contador pediu o extrato bancário?{' '}
          <span className="text-indigo-600">Nós organizamos tudo em 1 minuto.</span>
        </h1>
        <p className="mt-5 text-base sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Sem termos difíceis e sem planilhas complicadas. Envie o extrato do seu banco (OFX ou CSV), entenda para onde foi cada centavo em linguagem simples e gere um relatório limpo e pronto para o seu contador.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/mei/extratos"
            className="w-full sm:w-auto rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-7 py-4 text-sm sm:text-base shadow-lg shadow-indigo-600/20 transition"
          >
            📄 Organizar meu extrato agora (Grátis)
          </Link>
          <Link
            href="/entrar"
            className="w-full sm:w-auto rounded-2xl border-2 border-slate-300 bg-white hover:border-indigo-400 text-slate-800 font-bold px-7 py-4 text-sm sm:text-base transition"
          >
            Criar conta (Empresa/MEI ou Contador)
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          🔒 Seus dados são privados e protegidos. Você escolhe o que baixar ou enviar ao seu contador.
        </p>
      </section>

      {/* Como funciona em 3 passos */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Como resolvemos a dor de cabeça do fim do mês
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Transformamos o arquivo bruto do banco em um resumo que qualquer pessoa entende.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-lg grid place-items-center mb-4">
              1
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Você coloca o extrato do banco
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Basta baixar o arquivo <strong>OFX</strong> ou <strong>CSV</strong> no aplicativo do seu banco (Nubank, Inter, Cora, Itaú, Bradesco, Banco do Brasil) e soltar na tela.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-lg grid place-items-center mb-4">
              2
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              O sistema separa e explica tudo
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Classificamos automaticamente o que é <strong>Receita de venda</strong>, <strong>Despesa da empresa</strong>, <strong>Transferência pessoal</strong> ou <strong>Outros</strong> — explicando cada item em português claro.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 font-extrabold text-lg grid place-items-center mb-4">
              3
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Seu contador recebe tudo mastigado
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Com um clique você baixa o <strong>Relatório em PDF ou Excel</strong> ou envia direto para o painel do seu contador aqui na plataforma.
            </p>
          </div>
        </div>
      </section>

      {/* Duas Visões: Empresa/MEI e Contador */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border-2 border-indigo-100 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-xs px-3 py-1 rounded-lg mb-3">
                PARA QUEM EMPREENDE
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Área da Empresa / MEI
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                Pensada para quem não tem tempo a perder com termos contábeis complicados.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
                <li>✅ Upload simples de extrato OFX e CSV</li>
                <li>✅ Separação clara entre dinheiro da empresa e dinheiro pessoal</li>
                <li>✅ Acompanhamento educativo do limite anual do MEI (R$ 81 mil)</li>
                <li>✅ Checklist mensal de obrigações (DAS, notas e relatórios)</li>
              </ul>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
              <Link
                href="/mei"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-3 text-sm transition"
              >
                Abrir Dashboard do MEI →
              </Link>
              <Link
                href="/mei/extratos"
                className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl px-4 py-3 text-sm transition"
              >
                Organizar Extrato
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-sm flex flex-col justify-between">
            <div>
              <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-1 rounded-lg mb-3">
                PARA ESCRITÓRIOS E CONTADORES
              </span>
              <h3 className="text-2xl font-extrabold">
                Área do Contador Parceiro
              </h3>
              <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                Chega de receber fotos tremidas de extrato ou planilhas bagunçadas no WhatsApp no dia do fechamento.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
                <li>✅ Painel único com a lista dos seus clientes MEI e MPE</li>
                <li>✅ Extratos pré-classificados e revisados pelo próprio cliente</li>
                <li>✅ Observações claras sobre retiradas pessoais e vendas</li>
                <li>✅ Download imediato em CSV/Excel padronizado ou relatório PDF</li>
              </ul>
            </div>
            <div className="mt-7 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              <Link
                href="/contador"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl px-5 py-3 text-sm transition"
              >
                Abrir Painel do Contador →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
