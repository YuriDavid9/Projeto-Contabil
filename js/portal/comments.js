import { supabase } from './supabase.js';
import {
  translateCommentError,
  COMMUNITY_PROFILES,
  formatCommentWithProfileBadge,
  parseCommentProfileBadge
} from './pure.js';

export {
  translateCommentError,
  COMMUNITY_PROFILES,
  formatCommentWithProfileBadge,
  parseCommentProfileBadge
};

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

export async function listRecentCommunityComments(limit = 6) {
  const safeLimit = Math.min(20, Math.max(1, Number(limit) || 6));
  const { data, error } = await supabase
    .from('comments')
    .select(
      `id, post_id, user_id, body, hidden, created_at,
       author:profiles(id, display_name, role),
       post:posts(id, slug, title, status)`
    )
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(translateCommentError(error));
  return (data || []).filter((item) => !item.post || item.post.status === 'published');
}

