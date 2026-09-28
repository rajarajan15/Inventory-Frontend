import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './features/auth';
import { Dashboard } from './features/dashboard';
import { Products, ProductDetails, ProductForm } from './features/products';
import { Categories } from './features/categories';
import { Users } from './features/users';
import { Login, Register } from './features/auth';
import { Shell } from './shared/components/Layout';
import { Loading } from './shared/components/ui';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}

function Protected() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  return user ? (
    <Shell>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetails />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  ) : <Navigate to="/login" replace />;
}

export default App;
