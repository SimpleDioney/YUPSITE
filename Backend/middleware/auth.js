const jwt = require('jsonwebtoken');

// Sua função original - INTACTA
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

// Sua função original - INTACTA
const adminMiddleware = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// --- NOVA FUNÇÃO ADICIONADA ---
// Nova verificação para o sistema de impressão
const printerMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-print-key'];
    if (apiKey && apiKey === process.env.PRINT_API_KEY) {
        next(); // Chave da impressora válida
    } else {
        res.status(401).send('Chave de API da impressora inválida ou ausente.');
    }
};

// Exportamos as suas funções originais + a nova
module.exports = { 
    authMiddleware, 
    adminMiddleware,
    printerMiddleware // Adicionamos a nova função aqui
};
