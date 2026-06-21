import { describe, it, expect, beforeEach } from 'vitest';
import { saveAuthToken, getAuthUserId, getAuthName, clearAuth, isAuthenticated } from './auth';

describe('Auth Helpers', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should save and retrieve auth token', () => {
    saveAuthToken('user_123', 'John Doe');
    
    expect(getAuthUserId()).toBe('user_123');
    expect(getAuthName()).toBe('John Doe');
    expect(isAuthenticated()).toBe(true);
  });

  it('should return defaults if not authenticated', () => {
    expect(getAuthUserId()).toBe('user_001');
    expect(getAuthName()).toBe('User');
    expect(isAuthenticated()).toBe(false);
  });

  it('should clear auth correctly', () => {
    saveAuthToken('user_123', 'John Doe');
    expect(isAuthenticated()).toBe(true);
    
    clearAuth();
    expect(isAuthenticated()).toBe(false);
    expect(getAuthUserId()).toBe('user_001');
  });
});
