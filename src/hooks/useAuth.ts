import { useAuth as useOidcAuth } from "react-oidc-context";
import { User } from "oidc-client-ts";
import { useEffect } from "react";

// Wrapper hook to handle Test Mode mocking
export const useAuth = () => {
    // Detect test mode: Check if IAS is mock/missing OR explicit VITE_TEST_MODE OR query param
    // MUST match logic in main.tsx!
    const urlParams = new URLSearchParams(window.location.search);
    const testModeParam = urlParams.get('testMode') === 'true';
    const iasAuthority = import.meta.env.VITE_IAS_AUTHORITY || '';
    const iasClientId = import.meta.env.VITE_IAS_CLIENT_ID || '';
    const isTestMode =
        testModeParam ||  // Query parameter override for production E2E tests
        import.meta.env.VITE_TEST_MODE === 'true' ||
        iasAuthority.includes('mock') ||
        iasClientId.includes('mock') ||
        !iasAuthority ||
        !iasClientId;

    // Always call the hook (Rules of Hooks requirement)
    const oidcAuth = useOidcAuth();

    // Token expiration monitoring (production only)
    useEffect(() => {
        if (!isTestMode && oidcAuth.user) {
            const expiresAt = oidcAuth.user.expires_at;
            if (expiresAt) {
                const timeUntilExpiry = (expiresAt * 1000) - Date.now();
                const warningTime = 60000; // 1 minute warning

                if (timeUntilExpiry > warningTime) {
                    const timeout = setTimeout(() => {
                        console.warn("Your session will expire soon. Activity will extend it automatically.");
                    }, timeUntilExpiry - warningTime);

                    return () => clearTimeout(timeout);
                }
            }
        }
    }, [isTestMode, oidcAuth.user]);

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
                    email: "test.user@raise.test",
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
