import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout';
import { useOpportunities } from './stores/OpportunitiesStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { RequireAuth } from './components/auth/RequireAuth';
import { setSupabaseAuth, clearSupabaseAuth } from './lib/supabase';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./components/dashboard').then(m => ({ default: m.Dashboard })));
const OpportunityWorkflow = lazy(() => import('./components/workflow').then(m => ({ default: m.OpportunityWorkflow })));
const OpportunitiesPage = lazy(() => import('./pages/opportunities').then(m => ({ default: m.OpportunitiesPage })));
const NewOpportunityPage = lazy(() => import('./pages/opportunities/new').then(m => ({ default: m.NewOpportunityPage })));
const EditOpportunityPage = lazy(() => import('./pages/opportunities/edit').then(m => ({ default: m.EditOpportunityPage })));
const ApprovalsPage = lazy(() => import('./pages/approvals').then(m => ({ default: m.ApprovalsPage })));
const CustomersPage = lazy(() => import('./components/customers').then(m => ({ default: m.CustomersPage })));
const SettingsPage = lazy(() => import('./pages/settings').then(m => ({ default: m.SettingsPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size={48} />
      <p className="mt-4 text-slate-600 font-medium">Caricamento...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { selectedOpp, selectOpportunity } = useOpportunities();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <Dashboard onSelectOpp={(opp) => {
            selectOpportunity(opp);
            navigate(`/opportunity/${opp.id}`);
          }} />
        } />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/new" element={<NewOpportunityPage />} />
        <Route path="/opportunities/:id/edit" element={<EditOpportunityPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/opportunity/:id"
          element={
            selectedOpp ? (
              <OpportunityWorkflow
                opp={selectedOpp}
                onBack={() => {
                  selectOpportunity(null);
                  navigate('/');
                }}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  const auth = useAuth();

  // Sync SAP IAS auth with Supabase
  useEffect(() => {
    const syncAuth = async () => {
      if (auth.isAuthenticated && auth.user?.access_token) {
        // User logged in via SAP IAS - set token in Supabase
        await setSupabaseAuth(auth.user.access_token);
      } else {
        // User logged out - clear Supabase auth
        await clearSupabaseAuth();
      }
    };

    syncAuth();
  }, [auth.isAuthenticated, auth.user?.access_token]);

  return (
    <ErrorBoundary>
      <Toaster />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <RequireAuth>
          <Layout>
            <AppRoutes />
          </Layout>
        </RequireAuth>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
