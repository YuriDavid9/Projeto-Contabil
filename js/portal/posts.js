import { supabase } from './supabase.js';

export const PAGE_SIZE = 10;

export async function listCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name')
    .order('name', { ascending: true });
  if (error) throw new Error('Não foi possível carregar as categorias.');
  return data || [];
}

export async function listPublishedPosts({ categoryId = null, search = '', page = 1, pageSize = PAGE_SIZE } = {}) {
  const from = (Math.max(1, page) - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('posts')
    .select(
      `id, slug, title, summary, cover_url, status, published_at, created_at,
       category:categories(id, slug, name),
       author:profiles(id, display_name)`,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (categoryId) {
    query = query.eq('category_id', Number(categoryId));
  }

  const cleanSearch = String(search || '').trim();
  if (cleanSearch) {
    const safeTerm = cleanSearch.replace(/[%_,()]/g, ' ').trim();
    if (safeTerm) {
      query = query.or(`title.ilike.%${safeTerm}%,summary.ilike.%${safeTerm}%`);
    }
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error('Não foi possível carregar a lista de notícias.');
  return {
    posts: data || [],
    total: count || 0,
    page: Math.max(1, page),
    pageSize
  };
}

export async function getPostBySlug(slug) {
  const cleanSlug = String(slug || '').trim();
  if (!cleanSlug) return null;

  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, slug, title, summary, content_md, source_name, source_url, cover_url, status, published_at, created_at, updated_at,
       category:categories(id, slug, name),
       author:profiles(id, display_name)`
    )
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (error) throw new Error('Não foi possível carregar esta notícia.');
  if (!data || data.status !== 'published') return null;
  return data;
}

let markdownLibsPromise = null;

export async function loadMarkdownRenderer() {
  if (markdownLibsPromise) return markdownLibsPromise;
  markdownLibsPromise = Promise.all([
    import('https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm'),
    import('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm')
  ]).then(([markedMod, purifyMod]) => {
    const marked = markedMod.marked || markedMod.default;
    const DOMPurify = purifyMod.default || purifyMod;
    return { marked, DOMPurify };
  });
  return markdownLibsPromise;
}

export async function renderSafeMarkdown(markdownText) {
  const { marked, DOMPurify } = await loadMarkdownRenderer();
  const rawHtml = marked.parse(String(markdownText || ''), {
    gfm: true,
    breaks: true
  });

  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button']
  });

  const wrapper = document.createElement('div');
  wrapper.innerHTML = cleanHtml;
  wrapper.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!/^(https?:|mailto:|\/|#)/i.test(href)) {
      link.removeAttribute('href');
    }
    link.setAttribute('rel', 'noopener noreferrer');
    if (/^https?:/i.test(href)) {
      link.setAttribute('target', '_blank');
    }
  });
  return wrapper.innerHTML;
}
