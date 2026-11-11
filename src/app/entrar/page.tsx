'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSupabaseClient,
  loginAsDemoProfile,
  saveUserProfileLocal,
} from '@/lib/supabase/client';
import { AccountRole, UserProfile } from '@/types/saas';
import { EducationalTip } from '@/components/ui/EducationalTip';

export default function EntrarPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [role, setRole] = useState<AccountRole>('mei');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function redirectByRole(accountType: AccountRole) {
    if (accountType === 'contador') {
      router.push('/contador');
    } else {
      router.push('/mei');
    }
  }

  function handleQuickDemo(selectedRole: AccountRole) {
    const profile = loginAsDemoProfile(selectedRole);
    redirectByRole(profile.accountType);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || 'Empreendedor',
              account_type: role,
              company_name: companyName.trim(),
              cnpj: cnpj.trim(),
            },
          },
        });

        if (error) throw error;

        const profile: UserProfile = {
          id: data.user?.id || `local-${Date.now()}`,
          email: email.trim(),
          displayName: displayName.trim() || 'Empreendedor',
          accountType: role,
          companyName: companyName.trim() || undefined,
          cnpj: cnpj.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        saveUserProfileLocal(profile);
        setFeedback({
          type: 'ok',
          text: 'Conta criada com sucesso! Redirecionando para o seu painel...',
        });
        setTimeout(() => redirectByRole(role), 600);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const metaRole =
          (data.user?.user_metadata?.account_type as AccountRole) || role;
        const profile: UserProfile = {
          id: data.user?.id || `local-${Date.now()}`,
          email: data.user?.email || email.trim(),
          displayName:
            data.user?.user_metadata?.display_name ||
            email.split('@')[0] ||
            'Usuário',
          accountType: metaRole,
          companyName: data.user?.user_metadata?.company_name,
          cnpj: data.user?.user_metadata?.cnpj,
          createdAt: new Date().toISOString(),
        };

        saveUserProfileLocal(profile);
        redirectByRole(profile.accountType);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível autenticar no servidor agora.';
      setFeedback({
        type: 'err',
        text: `${message} (Dica: você também pode usar os botões de Acesso Rápido de Demonstração abaixo para testar todas as telas agora mesmo!)`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Acesse o AutoContábil
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1.5">
          Escolha se você é uma <strong>Empresa / MEI</strong> ou um <strong>Contador</strong> para ver a tela ideal para o seu dia a dia.
        </p>
      </div>

      {/* Caixa de Acesso Rápido Demo para facilitar avaliação imediata do MVP */}
      <div className="mb-8 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-emerald-600 text-white text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md mb-1">
              Testar MVP sem digitar senha
            </span>
            <h2 className="text-base font-extrabold text-slate-900">
              Quer experimentar o fluxo completo com 1 clique?
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
              Entre com uma conta de exemplo já preenchida para ver como o MEI organiza o extrato e como o Contador recebe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickDemo('mei')}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 text-xs sm:text-sm shadow-sm transition"
            >
              🏢 Entrar como Empresa/MEI (Demo)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('contador')}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs sm:text-sm shadow-sm transition"
            >
              👩‍💼 Entrar como Contador (Demo)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* Alternador Criar Conta vs Fazer Login */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Criar minha conta grátis
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Já tenho conta (Entrar)
          </button>
        </div>

        {/* Escolha do Tipo de Conta */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-2">
            Qual é o seu perfil?
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('mei')}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                role === 'mei'
                  ? 'border-indigo-600 bg-indigo-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-slate-900">
                  🏢 Sou Empresa / MEI
                </span>
                {role === 'mei' && (
                  <span className="bg-indigo-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Selecionado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Quero organizar meu extrato bancário, entender minhas entradas e saídas e enviar o relatório pronto ao meu contador.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('contador')}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                role === 'contador'
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-slate-900">
                  👩‍💼 Sou Contador(a)
                </span>
                {role === 'contador' && (
                  <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                    Selecionado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Quero acompanhar meus clientes MEI e pequenas empresas e baixar os extratos já organizados por eles.
              </p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu nome completo
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex.: Maria Oliveira"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === 'contador'
                    ? 'Nome do Escritório Contábil'
                    : 'Nome da sua Empresa / MEI'}
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={
                    role === 'contador'
                      ? 'Ex.: Oliveira Contabilidade'
                      : 'Ex.: Maria Doces Artesanais MEI'
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                CNPJ (opcional — ajuda a identificar seus relatórios)
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full sm:max-w-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seu melhor e-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com.br"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Senha (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-3.5 px-6 text-sm sm:text-base transition shadow-sm"
          >
            {loading
              ? 'Processando...'
              : mode === 'signup'
              ? `Criar conta como ${role === 'contador' ? 'Contador(a)' : 'Empresa / MEI'}`
              : 'Entrar na minha conta'}
          </button>
        </form>

        <div className="mt-6">
          <EducationalTip
            title="Por que existem dois tipos de conta?"
            variant="indigo"
          >
            <p>
              A conta <strong>Empresa / MEI</strong> foi desenhada para você organizar seu extrato bancário sem termos difíceis e controlar suas tarefas do mês. Já a conta <strong>Contador</strong> reúne todos os relatórios enviados pelos clientes em um painel pronto para conferência contábil.
            </p>
          </EducationalTip>
        </div>
      </div>
    </div>
  );
}
