const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const deliveryRoutes = require('./routes/delivery');
const bannerRoutes = require('./routes/banners'); // Importe a nova rota
const couponsAdminRoutes = require('./routes/couponsAdmin');
const { router: couponsRoutes } = require('./routes/coupons'); 
const categoriesAdminRoutes = require('./routes/categoriesAdmin');
const dashboardAdminRoutes = require('./routes/dashboardAdmin');
const categoriesRoutes = require('./routes/categories');

const app = express();
const server = http.createServer(app);

// Middleware
const corsOptions = {
  origin: [ 'https://e8c4e737a411.ngrok-free.app', 'http://localhost:8080', 'http://12.0.0.1:5500', 'https://preview--shopfront-sync.lovable.app', 'https://preview--orange-sunshine-remake.lovable.app'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Adicione esta linha para servir os arquivos da pasta de banners
app.use('/uploads/banners', express.static(path.join(__dirname, 'uploads/banners')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/categories', categoriesRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/coupons', couponsAdminRoutes);
app.use('/api/admin/categories', categoriesAdminRoutes);
app.use('/api/admin/dashboard', dashboardAdminRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
