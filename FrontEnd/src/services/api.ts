import axios from "axios";

const API_BASE_URL = "https://yup.notiffly.com.br/api";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
  }) => api.post("/auth/register", userData),

  updateUser: (
    userId: string,
    userData: { name: string; email: string; phone?: string; address?: string }
  ) => api.put(`/auth/user/${userId}`, userData),

  updatePassword: (
    userId: string,
    currentPassword: string,
    newPassword: string
  ) =>
    api.put(`/auth/user/${userId}/password`, { currentPassword, newPassword }),
};

// Products API calls
export const productsAPI = {
  // Adiciona categoryId opcional
  getAll: (categoryId?: string) => {
    let url = "/products";
    if (categoryId) {
      url += `?categoryId=${categoryId}`;
    }
    return api.get(url);
  },
  getById: (id: string) => api.get(`/products/${id}`),
};

// Admin API calls
export const adminAPI = {
  getProducts: () => api.get("/admin/products"),
  createProduct: (formData: FormData) =>
    api.post("/admin/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id: string, formData: FormData) =>
    api.put(`/admin/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleProductStatus: (id: string) =>
    api.patch(`/admin/products/${id}/toggle`),
  addStock: (productId: string, quantity: number, reason?: string) =>
    api.post("/admin/stock/add", { product_id: productId, quantity, reason }),
  removeStock: (productId: string, quantity: number, reason?: string) =>
    api.post("/admin/stock/remove", {
      product_id: productId,
      quantity,
      reason,
    }),
  getOrders: () => api.get("/admin/orders"),
  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
  getDashboardData: () => api.get('/admin/dashboard'),
  
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: { name: string }) => api.post('/admin/categories', data),
  updateCategory: (id: number, data: { name: string }) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/categories/${id}`),

  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  updateCoupon: (id: number, data: any) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id: number) => api.delete(`/admin/coupons/${id}`),

  getBrands: () => api.get('/brands'),
  createBrand: (data: { name: string; description?: string }) => api.post('/admin/brands', data),
  updateBrand: (id: number, data: { name: string; description?: string }) => api.put(`/admin/brands/${id}`, data),
  deleteBrand: (id: number) => api.delete(`/admin/brands/${id}`),
  requestUber: (orderId: string) => api.post('/delivery/create-delivery', { order_id: orderId }),
};

// Orders API calls
export const ordersAPI = {
  // Adiciona coupon_code opcional
  create: (data: { items: any[]; delivery_address: string; coupon_code?: string }) =>
    api.post("/orders", data),
  getMyOrders: () => api.get("/orders/my-orders"),
  getById: (id: string) => api.get(`/orders/${id}`),
};

// Admin Orders API calls
export const adminOrdersAPI = {
  getAll: () => api.get("/admin/orders"),
  updateStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),
};

// Delivery API calls
export const deliveryAPI = {
  getQuote: (dropoffAddress: string) =>
    api.post("/delivery/delivery-quote", { dropoff_address: dropoffAddress }),
};

// Payment API calls
export const paymentAPI = {
  // A função agora se chama 'createPreference' para refletir a nova rota do backend
  createPreference: (orderId: string, deliveryFee: number) => {
    return api.post("/payment/create-preference", {
      order_id: orderId,
      delivery_fee: deliveryFee, // Mantendo em reais
    });
  },
  // A função getStatus pode ser mantida para futuras verificações manuais se necessário,
  // mas não será mais usada no fluxo principal do checkout.
  getStatus: (paymentId: string) => {
    return api.get(`/payment/status/${paymentId}`);
  },
};

export const couponsAPI = {
    applyCoupon: (coupon_code: string, total: number) => api.post('/coupons/apply', { coupon_code, total })
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

export default api;