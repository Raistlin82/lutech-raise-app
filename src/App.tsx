import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import { useOpportunities } from './stores/OpportunitiesStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./components/dashboard').then(m => ({ default: m.Dashboard })));
const OpportunityWorkflow = lazy(() => import('./components/workflow').then(m => ({ default: m.OpportunityWorkflow })));
const OpportunitiesPage = lazy(() => import('./pages/opportunities').then(m => ({ default: m.OpportunitiesPage })));
const NewOpportunityPage = lazy(() => import('./pages/opportunities/new').then(m => ({ default: m.NewOpportunityPage })));
const EditOpportunityPage = lazy(() => import('./pages/opportunities/edit').then(m => ({ default: m.EditOpportunityPage })));
const ApprovalsPage = lazy(() => import('./pages/approvals').then(m => ({ default: m.ApprovalsPage })));
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
        selectedOpp ? (
          <Navigate to={`/opportunity/${selectedOpp.id}`} replace />
        ) : (
          <Dashboard onSelectOpp={(opp) => {
            selectOpportunity(opp);
            navigate(`/opportunity/${opp.id}`);
          }} />
        )
      } />
      <Route path="/opportunities" element={<OpportunitiesPage />} />
      <Route path="/opportunities/new" element={<NewOpportunityPage />} />
      <Route path="/opportunities/:id/edit" element={<EditOpportunityPage />} />
      <Route path="/approvals" element={<ApprovalsPage />} />
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
  return (
    <ErrorBoundary>
      <Toaster />
      <BrowserRouter basename="/lutech-raise-app">
        <Layout>
          <AppRoutes />
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
