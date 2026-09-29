import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth, Login, Register } from '../features/auth';
import { Dashboard } from '../features/dashboard';
import { Products, ProductDetails, ProductForm } from '../features/products';
import { Categories } from '../features/categories';
import { Users } from '../features/users';
import { NotFound } from '../features/public';
import { Shell } from '../shared/components/Layout';
import { Loading } from '../shared/components/ui';

/** /o/:slug/* — one organization's portal (loaded only when visited). */
export default function OrgArea() {
  return (
    <AuthProvider>
      <OrgRoutes />
    </AuthProvider>
  );
}

function OrgRoutes() {
  const { ready, orgMissing, user, path } = useAuth();
  if (!ready) return <Loading />;
  if (orgMissing) {
    return <NotFound title="Organization not found" text="This StockWise portal does not exist or is not active. Check the link you were given." />;
  }

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="*" element={user ? (
        <Shell>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="categories" element={<Categories />} />
            <Route path="users" element={user.role === 'ADMIN' ? <Users /> : <Navigate to={path()} replace />} />
            <Route path="*" element={<Navigate to={path()} replace />} />
          </Routes>
        </Shell>
      ) : <Navigate to={path('/login')} replace />} />
    </Routes>
  );
}
