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
