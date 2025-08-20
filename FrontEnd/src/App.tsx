import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { CartDrawer } from "@/components/cart/CartDrawer";

// Pages
import Index from "@/pages/Index";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CheckoutPage from "@/pages/CheckoutPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import NotFound from "@/pages/NotFound";
import Termos from "@/pages/Termos";
import Politica from "@/pages/Politica";
import Cookies from "@/pages/Cookies";
import PaymentSuccessPage from "./pages/PaymentSuccess";
import ProfilePage from "./pages/ProfilePage";

// Admin Pages
import AdminLayout from "@/pages/admin/AdminLayout";
import ProductsAdmin from "@/pages/admin/ProductsAdmin";
import OrdersAdmin from "@/pages/admin/OrdersAdmin";
import { BannerAdmin } from "./pages/admin/BannerAdmin";
import PaymentFailurePage from "./pages/PaymentFailure";
import PaymentPendingPage from "./pages/PaymentPending";
import OrderDetailPage from "./pages/OrderDetailPage";

// Novas importações das páginas de admin
import { DashboardAdmin } from "./pages/admin/DashboardAdmin";
import { CategoriesAdmin } from "./pages/admin/CategoriesAdmin";
import { CouponsAdmin } from "./pages/admin/CouponsAdmin";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Politica />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/success" element={<PaymentSuccessPage />} />
          <Route path="/failure" element={<PaymentFailurePage />} />
          <Route path="/pending" element={<PaymentPendingPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Rota principal do admin vai para o dashboard */}
            <Route index element={<DashboardAdmin />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route path="products" element={<ProductsAdmin />} />
            {/* Novas rotas de admin */}
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="coupons" element={<CouponsAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="banners" element={<BannerAdmin />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <CartDrawer />
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;