import { useAuth as useOidcAuth } from "react-oidc-context";
import { User } from "oidc-client-ts";

// Wrapper hook to handle Test Mode mocking
export const useAuth = () => {
    // Check if we are in Test Mode (E2E)
    const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

    if (isTestMode) {
        // Return a mock auth context that simulates a logged-in user
        return {
            isAuthenticated: true,
            isLoading: false,
            error: null,
            activeNavigator: undefined,
            signinRedirect: async () => { },
            signoutRedirect: async () => { },
            removeUser: async () => { },
            user: {
                profile: {
                    sub: "test-user-id",
                    email: "test@example.com",
                    given_name: "Test",
                    family_name: "User",
                    name: "Test User"
                },
                access_token: "mock-access-token",
            } as User
        };
    }

    // In production/dev, use the real OIDC Auth hook
    return useOidcAuth();
};
