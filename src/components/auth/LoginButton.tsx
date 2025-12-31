import { useAuth } from "react-oidc-context";

export const LoginButton = () => {
    const auth = useAuth();

    switch (auth.activeNavigator) {
        case "signinSilent":
            return <div>Signing in...</div>;
        case "signoutRedirect":
            return <div>Signing out...</div>;
    }

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }

    if (auth.error) {
        return <div className="text-red-600">Error: {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        return (
            <button
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                onClick={() => void auth.removeUser()}
            >
                Log out
            </button>
        );
    }

    return (
        <button
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-sm"
            onClick={() => void auth.signinRedirect()}
        >
            Log in with SAP IAS
        </button>
    );
};
