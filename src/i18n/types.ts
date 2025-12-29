import common from './locales/it/common.json';
import dashboard from './locales/it/dashboard.json';
import opportunities from './locales/it/opportunities.json';
import workflow from './locales/it/workflow.json';
import settings from './locales/it/settings.json';
import customers from './locales/it/customers.json';

// Extend react-i18next module for type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      dashboard: typeof dashboard;
      opportunities: typeof opportunities;
      workflow: typeof workflow;
      settings: typeof settings;
      customers: typeof customers;
    };
  }
}
