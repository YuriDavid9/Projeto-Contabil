import { supabase } from './supabase.js';

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

export async function getSessionAndProfile() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session || null;
  if (!session?.user) {
    return { session: null, user: null, profile: null };
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role, created_at')
    .eq('id', session.user.id)
    .maybeSingle();

  return { session, user: session.user, profile: profile || null };
}

export async function signUp({ email, password, displayName }) {
  const cleanName = String(displayName || '').trim();
  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('O nome de exibição deve ter entre 2 e 50 caracteres.');
  }
  if (String(password || '').length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
  const redirectUrl = new URL('entrar.html', window.location.href).href;
  const { data, error } = await supabase.auth.signUp({
    email: String(email || '').trim(),
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { display_name: cleanName }
    }
  });
  if (error) throw new Error(translateAuthError(error));
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || '').trim(),
    password
  });
  if (error) throw new Error(translateAuthError(error));
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(translateAuthError(error));
}

export async function resetPassword(email) {
  const cleanEmail = String(email || '').trim();
  if (!cleanEmail) {
    throw new Error('Informe seu e-mail para receber o link de recuperação.');
  }
  const redirectUrl = new URL('entrar.html?modo=nova-senha', window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectUrl
  });
  if (error) throw new Error(translateAuthError(error));
}

export async function updatePassword(newPassword) {
  if (String(newPassword || '').length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(translateAuthError(error));
}

