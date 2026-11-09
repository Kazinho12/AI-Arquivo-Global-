export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ProfileFormValues {
  username: string;
  displayName: string;
  bio: string;
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return "O username deve conter pelo menos 3 caracteres.";
  }
  if (trimmed.length > 30) {
    return "O username não pode exceder 30 caracteres.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "O username só pode conter letras (a-z), números (0-9) e sublinhados (_).";
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "O nome de apresentação é obrigatório.";
  }
  if (trimmed.length > 60) {
    return "O nome de apresentação não pode exceder 60 caracteres.";
  }
  return null;
}

export function validateBio(bio: string): string | null {
  if (bio.length > 500) {
    return "A biografia não pode exceder 500 caracteres.";
  }
  return null;
}
