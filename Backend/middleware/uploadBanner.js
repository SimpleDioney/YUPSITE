const multer = require('multer');
const path = require('path');
const fs = require('fs');

const bannerUploadsDir = 'uploads/banners';

// Criar pasta de uploads de banner se não existir
if (!fs.existsSync(bannerUploadsDir)) {
  fs.mkdirSync(bannerUploadsDir, { recursive: true });
  console.log('Pasta uploads/banners criada');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bannerUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadBanner = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

module.exports = uploadBanner;
