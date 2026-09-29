import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Landing, RequestAccess, AcceptInvitation, NotFound } from './features/public';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { Loading } from './shared/components/ui';

// Each portal is its own bundle: visitors of one area never download the other
const PlatformArea = lazy(() => import('./areas/PlatformArea'));
const OrgArea = lazy(() => import('./areas/OrgArea'));

/**
 * Three separate areas:
 *  - public pages (landing, subscription request, invitation acceptance)
 *  - /platform/*  StockWise super admin portal
 *  - /o/:slug/*   one portal per client organization
 */
function App() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/invite/:token" element={<AcceptInvitation />} />
          <Route path="/platform/*" element={<PlatformArea />} />
          <Route path="/o/:slug/*" element={<OrgArea />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
