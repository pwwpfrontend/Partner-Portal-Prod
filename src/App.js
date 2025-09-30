import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import PartnerApplication from "./components/PartnerApplication";
import NDAPage from "./components/NDAPage";
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

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* NOTE: If using react-router v6 stable, the future prop is not needed. Kept for now. */}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/application" element={<PartnerApplication />} />
        <Route path="/partner-application" element={<PartnerApplication />} />
        <Route path="/nda" element={<NDAPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Private routes - All authenticated users */}
        <Route path="/dashboard" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Products /></PrivateRoute>} />
        <Route path="/support" element={<PrivateRoute roles={["admin", "professional", "expert", "master"]}><Support /></PrivateRoute>} />

        {/* Routes for all non-admin users */}
        <Route path="/request-quote" element={<PrivateRoute roles={["professional", "expert", "master"]}><RequestQuote /></PrivateRoute>} />

        {/* Admin-only routes: wrap with PrivateRoute to ensure auth resolved before role checks */}
        <Route path="/admin/products" element={
          <PrivateRoute roles={["admin"]}>
            <RoleGuard allowedRoles={["admin"]}><AdminProducts /></RoleGuard>
          </PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute roles={["admin"]}>
            <RoleGuard allowedRoles={["admin"]}><AdminUsers /></RoleGuard>
          </PrivateRoute>
        } />
        <Route path="/admin/quotes" element={
          <PrivateRoute roles={["admin"]}>
            <RoleGuard allowedRoles={["admin"]}><ManageQuotes /></RoleGuard>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;