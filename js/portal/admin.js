import { supabase } from './supabase.js';
import { translateCommentError } from './comments.js';

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
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Acesso negado pelo banco de dados. Apenas administradores podem salvar notícias.';
  }
  return msg || 'Não foi possível salvar a notícia.';
}

export async function listAllPostsAdmin() {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, slug, title, summary, content_md, category_id, source_name, source_url, cover_url, status, published_at, created_at, updated_at,
       category:categories(id, slug, name)`
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(translatePostError(error));
  return data || [];
}

export async function checkSlugExists(slug, ignorePostId = null) {
  const clean = String(slug || '').trim();
  if (!clean) return false;
  let query = supabase.from('posts').select('id').eq('slug', clean);
  if (ignorePostId) {
    query = query.neq('id', ignorePostId);
  }
  const { data, error } = await query.maybeSingle();
  if (error) return false;
  return Boolean(data?.id);
}

export async function savePostAdmin({
  id = null,
  slug,
  title,
  summary,
  content_md,
  category_id,
  source_name,
  source_url,
  cover_url,
  status,
  author_id
}) {
  const cleanTitle = String(title || '').trim();
  const cleanSlug = String(slug || '').trim();
  const cleanSummary = String(summary || '').trim();
  const cleanContent = String(content_md || '').trim();

  if (cleanTitle.length < 5 || cleanTitle.length > 160) {
    throw new Error('O título deve ter entre 5 e 160 caracteres.');
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(cleanSlug)) {
    throw new Error('O slug deve usar apenas letras minúsculas, números e hífens (sem espaços ou acentos).');
  }
  if (!cleanSummary || cleanSummary.length > 300) {
    throw new Error('Informe um resumo de até 300 caracteres.');
  }
  if (!cleanContent) {
    throw new Error('O conteúdo da notícia não pode ficar vazio.');
  }

  const duplicated = await checkSlugExists(cleanSlug, id);
  if (duplicated) {
    throw new Error('Já existe outra notícia usando este slug. Altere o campo Slug antes de salvar.');
  }

  const payload = {
    slug: cleanSlug,
    title: cleanTitle,
    summary: cleanSummary,
    content_md: cleanContent,
    category_id: category_id ? Number(category_id) : null,
    source_name: String(source_name || '').trim() || null,
    source_url: String(source_url || '').trim() || null,
    cover_url: String(cover_url || '').trim() || null,
    status: status === 'published' ? 'published' : 'draft'
  };

  if (id) {
    const { data, error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(translatePostError(error));
    return data;
  } else {
    payload.author_id = author_id;
    const { data, error } = await supabase
      .from('posts')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(translatePostError(error));
    return data;
  }
}

export async function togglePostStatusAdmin(postId, newStatus) {
  const { data, error } = await supabase
    .from('posts')
    .update({ status: newStatus === 'published' ? 'published' : 'draft' })
    .eq('id', postId)
    .select()
    .single();
  if (error) throw new Error(translatePostError(error));
  return data;
}

export async function deletePostAdmin(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  if (error) throw new Error(translatePostError(error));
}

export async function listRecentCommentsAdmin(limit = 50) {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `id, post_id, user_id, body, hidden, created_at,
       author:profiles(id, display_name, role),
       post:posts(id, slug, title)`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(translateCommentError(error));
  return data || [];
}

