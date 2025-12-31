import { useAuth } from "../../hooks/useAuth";
import { useTranslation } from "react-i18next";

export const LoginButton = () => {
    const auth = useAuth();
    const { t } = useTranslation();

    switch (auth.activeNavigator) {
        case "signinSilent":
            return <div>{t('auth.signingIn')}</div>;
        case "signoutRedirect":
            return <div>{t('auth.signingOut')}</div>;
    }

    if (auth.isLoading) {
        return <div>{t('auth.loading')}</div>;
    }

    if (auth.error) {
        return <div className="text-red-600">Error: {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        return (
            <button
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                onClick={() => void auth.signoutRedirect()}
            >
                {t('auth.logout')}
            </button>
        );
    }

    return (
        <button
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 shadow-sm"
            onClick={() => void auth.signinRedirect()}
        >
            {t('auth.loginWithSap')}
        </button>
    );
};
