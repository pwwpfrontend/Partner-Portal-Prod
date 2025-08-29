import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import PartnerApplication from "./components/PartnerApplication";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import RequestQuote from "./components/RequestQuote";
import ManageQuotes from "./components/ManageQuotes";
import Support from "./components/Support";
import AdminProducts from "./components/AdminProducts";
import AdminUsers from "./components/AdminUsers";
import PrivateRoute from "./components/PrivateRoute";
import RoleGuard from "./components/RoleGuard";
import Unauthorized from "./components/Unauthorized";
import { ProductProvider } from "./context/ProductContext";

function App() {
  return (
    <ProductProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/application" element={<PartnerApplication />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Private routes - All authenticated users */}
        <Route path="/dashboard" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Products /></PrivateRoute>} />
        <Route path="/support" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Support /></PrivateRoute>} />

        {/* Routes for all non-admin users */}
        <Route path="/request-quote" element={<PrivateRoute roles={["professional", "expert", "master"]}><RequestQuote /></PrivateRoute>} />

        {/* Admin-only routes */}
        <Route path="/admin/products" element={<RoleGuard allowedRoles={["admin"]}><AdminProducts /></RoleGuard>} />
        {/* AdminPricing route removed */}
        <Route path="/admin/users" element={<RoleGuard allowedRoles={["admin"]}><AdminUsers /></RoleGuard>} />
        <Route path="/admin/quotes" element={<RoleGuard allowedRoles={["admin"]}><ManageQuotes /></RoleGuard>} />
        </Routes>
      </Router>
    </ProductProvider>
  );
}

export default App;