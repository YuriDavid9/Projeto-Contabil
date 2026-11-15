export const COMMUNITY_PROFILES = [
  'Membro da Comunidade',
  'Contador(a)',
  'Contador(a) Iniciante',
  'MEI / Autônomo',
  'Pequena Empresa'
];

export function formatCommentWithProfileBadge(body, profileBadge = '') {
  const cleanBody = String(body || '').trim();
  const cleanBadge = String(profileBadge || '').trim();
  if (!cleanBody) return '';
  if (!cleanBadge || cleanBadge === 'Membro da Comunidade' || !COMMUNITY_PROFILES.includes(cleanBadge)) {
    return cleanBody;
  }
  const prefix = `[Perfil: ${cleanBadge}] `;
  const combined = `${prefix}${cleanBody}`;
  return combined.length <= 1000 ? combined : cleanBody;
}

export function parseCommentProfileBadge(rawBody) {
  const text = String(rawBody || '');
  const match = /^\[Perfil:\s*([^\]]+)\]\s*([\s\S]*)$/.exec(text);
  if (!match) {
    return { profileBadge: null, cleanBody: text };
  }
  const candidate = match[1].trim();
  const rest = match[2].trim();
  if (!COMMUNITY_PROFILES.includes(candidate) || !rest) {
    return { profileBadge: null, cleanBody: text };
  }
  return { profileBadge: candidate, cleanBody: rest };
}

export function isHttpUrl(value) {
  const clean = String(value ?? '').trim();
  if (!clean) return false;
  return /^https?:\/\/\S+$/i.test(clean);
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 120);
}

export function translatePostError(error) {
  const msg = String(error?.message || error || '');
  const lower = msg.toLowerCase();
  if (lower.includes('posts_slug_key') || lower.includes('duplicate key')) {
    return 'Já existe uma notícia com este slug (endereço). Escolha outro slug.';
  }
  if (lower.includes('posts_slug_check')) {
    return 'O slug deve conter apenas letras minúsculas, números e hífens (ex.: minha-noticia-1).';
  }
  if (lower.includes('posts_title_check')) {
    return 'O título deve ter entre 5 e 160 caracteres.';
  }
  if (lower.includes('posts_summary_check')) {
    return 'O resumo deve ter no máximo 300 caracteres.';
  }
  if (lower.includes('posts_source_url_check')) {
    return 'O link da fonte deve começar com http:// ou https://.';
  }
  if (lower.includes('posts_cover_url_check')) {
    return 'A URL da imagem de capa deve começar com http:// ou https://.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Acesso negado pelo banco de dados. Apenas administradores podem salvar notícias.';
  }
  return msg || 'Não foi possível salvar a notícia.';
}

export function translateCommentError(error) {
  const msg = String(error?.message || error || '');
  const lower = msg.toLowerCase();
  if (lower.includes('aguarde alguns segundos antes de comentar')) {
    return 'Aguarde 20 segundos antes de enviar outro comentário.';
  }
  if (lower.includes('comments_body_check') || lower.includes('char_length(body)')) {
    return 'O comentário deve ter entre 2 e 1000 caracteres.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Você não tem permissão para realizar esta ação. Faça login novamente.';
  }
  return msg || 'Não foi possível concluir a operação nos comentários.';
}

export function translateAuthError(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e a pasta de spam) e clique no link de confirmação.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak_password')) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit') || msg.includes('for security purposes')) {
    return 'Muitas tentativas seguidas ou limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) {
    return 'Digite um endereço de e-mail válido.';
  }
  return error?.message || 'Ocorreu um erro inesperado. Tente novamente.';
}

export function estimateReadingTimeMinutes(text) {
  const clean = String(text || '')
    .replace(/[#>*_`~\-\[\]()!]/g, ' ')
    .trim();
  if (!clean) return 1;
  const words = clean.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function formatReadingTime(text) {
  const mins = estimateReadingTimeMinutes(text);
  return `${mins} min de leitura`;
}

export function parseSavedPostSlugs(rawJson) {
  try {
    const parsed = JSON.parse(String(rawJson || '[]'));
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((s) => String(s || '').trim()).filter(Boolean))].slice(0, 100);
  } catch {
    return [];
  }
}

export function toggleSavedPostSlug(currentSlugs, slug) {
  const cleanSlug = String(slug || '').trim();
  const list = Array.isArray(currentSlugs) ? [...currentSlugs] : [];
  if (!cleanSlug) return { slugs: list, saved: false };
  const idx = list.indexOf(cleanSlug);
  if (idx >= 0) {
    list.splice(idx, 1);
    return { slugs: list, saved: false };
  }
  return { slugs: [cleanSlug, ...list].slice(0, 100), saved: true };
}

export function buildNewsShareUrl({ title, url }) {
  const cleanTitle = String(title || 'Notícia do AutoContábil Hub').trim();
  const cleanUrl = String(url || '').trim();
  const message = cleanUrl
    ? `Confira no AutoContábil Hub: ${cleanTitle} — ${cleanUrl}`
    : `Confira no AutoContábil Hub: ${cleanTitle}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export function extractPracticalHighlights({ title = '', summary = '', categoryName = '', sourceName = '' } = {}) {
  const combined = `${title} ${summary} ${categoryName}`.toLowerCase();
  let publico = 'Contadores iniciantes, MEIs, autônomos e pequenas empresas.';
  if (combined.includes('mei') || combined.includes('microempreendedor') || combined.includes('dasn')) {
    publico = 'Microempreendedores Individuais (MEIs), autônomos e escritórios que atendem MEI.';
  } else if (combined.includes('reforma') || combined.includes('ibs') || combined.includes('cbs')) {
    publico = 'Empresas do Simples Nacional, contadores e gestores em adaptação à Reforma Tributária.';
  } else if (combined.includes('xml') || combined.includes('nf-e') || combined.includes('nfc-e') || combined.includes('cfop')) {
    publico = 'Setor fiscal de escritórios contábeis, BPO financeiro e emissores de NF-e/NFC-e.';
  } else if (combined.includes('cnpj')) {
    publico = 'Escritórios contábeis, empresas em abertura/atualização cadastral e sistemas integrados.';
  }

  const pontoCentral = String(summary || title || 'Atualização normativa e operacional para rotina contábil e fiscal.').trim();
  const fonteLabel = String(sourceName || 'órgão oficial competente').trim();
  const acaoPratica = `Confira a íntegra na fonte oficial (${fonteLabel}) e valide a aplicação com o contador responsável antes de alterar rotinas.`;

  return { publico, pontoCentral, acaoPratica };
}
