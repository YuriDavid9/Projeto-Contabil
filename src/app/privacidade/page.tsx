import React from 'react';

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Política de Privacidade (Em Linguagem Clara)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-sm">
        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            1. O que fazemos com os seus dados e extratos?
          </h2>
          <p className="mt-2">
            O <strong>AutoContábil</strong> existe exclusivamente para ajudar você (MEI ou pequena empresa) a organizar suas movimentações bancárias e compartilhá-las de forma clara com o seu contador. Nós <strong>nunca vendemos</strong> nem compartilhamos seus dados financeiros com bancos, financeiras ou anunciantes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            2. Quais informações são coletadas?
          </h2>
          <ul className="mt-2 list-disc pl-5 space-y-1.5">
            <li>
              <strong>Dados de cadastro:</strong> Nome, e-mail, tipo de conta (Empresa/MEI ou Contador) e, opcionalmente, nome da empresa e CNPJ para identificação nos relatórios.
            </li>
            <li>
              <strong>Extratos importados (OFX e CSV):</strong> Lidos para classificar suas entradas e saídas e gerar os relatórios PDF/CSV que você mesmo baixa ou envia ao seu contador vinculado.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-extrabold text-slate-900">
            3. Segurança e Controle Total pelo Usuário
          </h2>
          <p className="mt-2">
            Utilizamos autenticação e banco de dados com isolamento por linha (Row Level Security — RLS no Supabase). Isso significa que apenas você e o contador para quem você enviar o relatório podem visualizar seus fechamentos mensais. Você pode excluir seus extratos ou sua conta a qualquer momento.
          </p>
        </section>
      </div>
    </div>
  );
}
