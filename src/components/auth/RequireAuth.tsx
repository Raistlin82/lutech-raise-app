import { useAuth } from "react-oidc-context";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function RequireAuth({ children }: { children: JSX.Element }) {
    const auth = useAuth();

    if (auth.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size={48} />
            </div>
        );
    }

    if (!auth.isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Autenticazione Richiesta</h1>
                    <p className="text-slate-600">Accesso riservato. Effettua il login con il tuo account aziendale SAP.</p>
                    <div className="pt-4">
                        <button
                            onClick={() => void auth.signinRedirect()}
                            className="w-full px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Accedi con SAP IAS
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
