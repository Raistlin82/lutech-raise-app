import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "../common/LoadingSpinner";

export function RequireAuth({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
            void auth.signinRedirect();
        }
    }, [auth]);

    if (auth.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size={48} />
            </div>
        );
    }

    if (auth.error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-red-50">
                <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 border border-red-200">
                    <h1 className="text-2xl font-bold text-red-700">{t('auth.errorTitle')}</h1>
                    <p className="text-slate-600">{t('auth.errorMessage')}</p>
                    <pre className="text-xs text-left bg-slate-100 p-4 rounded overflow-auto text-red-600 mb-4">
                        {auth.error.message}
                    </pre>
                    <button
                        onClick={() => void auth.signinRedirect()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        {t('auth.retry')}
                    </button>
                </div>
            </div>
        );
    }

    if (!auth.isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4 bg-slate-50">
                <LoadingSpinner size={48} />
                <p className="text-slate-500 font-medium">{t('auth.redirecting')}</p>
            </div>
        );
    }

    return children;
}
