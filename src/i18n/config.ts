import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import commonIT from './locales/it/common.json';
import dashboardIT from './locales/it/dashboard.json';
import opportunitiesIT from './locales/it/opportunities.json';
import workflowIT from './locales/it/workflow.json';
import settingsIT from './locales/it/settings.json';
import customersIT from './locales/it/customers.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: {
        common: commonIT,
        dashboard: dashboardIT,
        opportunities: opportunitiesIT,
        workflow: workflowIT,
        settings: settingsIT,
        customers: customersIT,
      },
    },
    lng: 'it',
    fallbackLng: 'it',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'opportunities', 'workflow', 'settings', 'customers'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    returnNull: false,
    debug: import.meta.env.DEV,
  });

export default i18n;
