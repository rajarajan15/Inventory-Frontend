import { Navigate, Route, Routes } from 'react-router-dom';
import {
  PlatformAuthProvider, usePlatformAuth, PlatformLogin, PlatformShell, Requests, Organizations, OrganizationDetail,
} from '../features/platform';

/** /platform/* — StockWise super admin portal (loaded only when visited). */
export default function PlatformArea() {
  return (
    <PlatformAuthProvider>
      <PlatformRoutes />
    </PlatformAuthProvider>
  );
}

function PlatformRoutes() {
  const { user } = usePlatformAuth();
  return (
    <Routes>
      <Route path="login" element={<PlatformLogin />} />
      <Route path="*" element={user ? (
        <PlatformShell>
          <Routes>
            <Route index element={<Navigate to="requests" replace />} />
            <Route path="requests" element={<Requests />} />
            <Route path="organizations" element={<Organizations />} />
            <Route path="organizations/:id" element={<OrganizationDetail />} />
            <Route path="*" element={<Navigate to="/platform" replace />} />
          </Routes>
        </PlatformShell>
      ) : <Navigate to="/platform/login" replace />} />
    </Routes>
  );
}
