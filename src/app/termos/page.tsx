import React from 'react';

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Termos de Uso
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Regras claras e transparentes sobre o uso do AutoContábil.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            1. Papel educativo e organizacional da plataforma
          </h2>
          <p className="mt-2">
            O <strong>AutoContábil</strong> é uma plataforma tecnológica de organização financeira e educação fiscal para MEIs, pequenas empresas e contadores. As classificações automáticas de extratos (Receita, Despesa, Transferência e Outros) são sugestões para facilitar a rotina e <strong>não substituem a análise técnica e legal do seu contador</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            2. Responsabilidade sobre as informações enviadas
          </h2>
          <p className="mt-2">
            Cabe ao usuário revisar as categorias sugeridas antes de baixar ou enviar o relatório final ao seu escritório contábil, bem como manter a guarda das notas fiscais e comprovantes originais exigidos por lei.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            3. Evolução da Plataforma
          </h2>
          <p className="mt-2">
            Esta versão corresponde ao MVP (Produto Mínimo Viável) do AutoContábil. Novas ferramentas fiscais, importação de XML e serviços de apoio contábil serão adicionados gradualmente.
          </p>
        </section>
      </div>
    </div>
  );
}
