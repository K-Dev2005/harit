// ---------------------------------------------------------------------------
// Auth helpers — stored in localStorage, used across the app
// ---------------------------------------------------------------------------

export interface AuthState {
  token: string;
  userId: string;
  name: string;
}

export function saveAuthToken(token: string, userId: string, name: string): void {
  localStorage.setItem('harit_token', token);
  localStorage.setItem('harit_userId', userId);
  localStorage.setItem('harit_name', name);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('harit_token');
}

export function getAuthUserId(): string {
  return localStorage.getItem('harit_userId') || 'user_001';
}

export function getAuthName(): string {
  return localStorage.getItem('harit_name') || 'User';
}

export function clearAuth(): void {
  localStorage.removeItem('harit_token');
  localStorage.removeItem('harit_userId');
  localStorage.removeItem('harit_name');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('harit_token');
}
