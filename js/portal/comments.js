import { supabase } from './supabase.js';

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

export async function listCommentsByPost(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `id, post_id, user_id, body, hidden, created_at,
       author:profiles(id, display_name, role)`
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(translateCommentError(error));
  return data || [];
}

export async function createComment({ postId, userId, body }) {
  const cleanBody = String(body || '').trim();
  if (cleanBody.length < 2 || cleanBody.length > 1000) {
    throw new Error('O comentário deve ter entre 2 e 1000 caracteres.');
  }
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      body: cleanBody
    })
    .select(
      `id, post_id, user_id, body, hidden, created_at,
       author:profiles(id, display_name, role)`
    )
    .single();

  if (error) throw new Error(translateCommentError(error));
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw new Error(translateCommentError(error));
}

export async function toggleHideComment(commentId, hidden) {
  const { error } = await supabase
    .from('comments')
    .update({ hidden: Boolean(hidden) })
    .eq('id', commentId);
  if (error) throw new Error(translateCommentError(error));
}

