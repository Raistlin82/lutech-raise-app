import { useAuth as useOidcAuth } from "react-oidc-context";
import { User } from "oidc-client-ts";

// Wrapper hook to handle Test Mode mocking
export const useAuth = () => {
    // Check if we are in Test Mode (E2E)
    const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

    // Always call the hook (Rules of Hooks requirement)
    const oidcAuth = useOidcAuth();

    // In test mode, return mock data instead of real auth
    if (isTestMode) {
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

    // In production/dev, return the real OIDC Auth
    return oidcAuth;
};
