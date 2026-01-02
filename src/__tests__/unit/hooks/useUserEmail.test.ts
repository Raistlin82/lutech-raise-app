import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserEmail } from '@/hooks/useUserEmail';
import { useAuth } from 'react-oidc-context';

vi.mock('react-oidc-context');

describe('useUserEmail', () => {
  it('should return user email from auth context', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        profile: {
          email: 'test@example.com'
        }
      },
      isAuthenticated: true
    } as any);

    const { result } = renderHook(() => useUserEmail());
    expect(result.current).toBe('test@example.com');
  });

  it('should return null if not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false
    } as any);

    const { result } = renderHook(() => useUserEmail());
    expect(result.current).toBeNull();
  });
});
