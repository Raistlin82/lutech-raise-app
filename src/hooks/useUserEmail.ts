import { useAuth } from './useAuth';

/**
 * Extract user email from SAP IAS JWT token (or mock user in test mode)
 * Used as user identifier for data segregation
 */
export function useUserEmail(): string | null {
  const auth = useAuth();

  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  // Extract email from JWT claims
  const email = auth.user.profile?.email;

  if (!email || typeof email !== 'string') {
    console.warn('User authenticated but email not found in JWT claims');
    return null;
  }

  return email;
}
