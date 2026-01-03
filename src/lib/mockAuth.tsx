/**
 * Mock Authentication Provider for E2E Tests
 *
 * This provider bypasses IAS authentication in test mode and provides
 * a mock authenticated user for E2E testing.
 */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Mock user for testing
const MOCK_USER = {
  profile: {
    email: 'test.user@raise.test',
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    sub: 'mock-user-id-12345',
  },
  access_token: 'mock-access-token',
  id_token: 'mock-id-token',
  token_type: 'Bearer',
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
};

// Mock Auth Context matching react-oidc-context structure
interface MockAuthContextValue {
  user: typeof MOCK_USER | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  signinRedirect: () => Promise<void>;
  signoutRedirect: () => Promise<void>;
  removeUser: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextValue>({
  user: MOCK_USER,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  signinRedirect: async () => {},
  signoutRedirect: async () => {},
  removeUser: async () => {},
});

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const value: MockAuthContextValue = {
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    signinRedirect: async () => {
      console.log('[MockAuth] signinRedirect called - already authenticated');
    },
    signoutRedirect: async () => {
      console.log('[MockAuth] signoutRedirect called');
    },
    removeUser: async () => {
      console.log('[MockAuth] removeUser called');
    },
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  return useContext(MockAuthContext);
}

// Export mock user for test utilities
export { MOCK_USER };
