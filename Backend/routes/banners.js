const express = require('express');
const db = require('../database/db');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const uploadBanner = require('../middleware/uploadBanner');
const fs = require('fs');
const path = require('path');

// ROTA PÚBLICA - Listar banners ativos para o frontend
router.get('/', (req, res) => {
  const bannerType = req.query.type === 'celular' ? 'celular' : 'normal';

  db.all('SELECT * FROM banners WHERE is_active = 1 AND type = ? ORDER BY created_at DESC', [bannerType], (err, banners) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar banners' });
    }
    res.json(banners);
  });
});

// --- ROTAS DE ADMINISTRAÇÃO ---

// ROTA ADMIN - Adicionar banners (normal e celular)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  uploadBanner.fields([
    { name: 'photo_normal', maxCount: 1 },
    { name: 'photo_celular', maxCount: 1 }
  ]),
  (req, res) => {
    const { title } = req.body;
    const photoNormalFile = req.files['photo_normal'] ? req.files['photo_normal'][0] : null;
    const photoCelularFile = req.files['photo_celular'] ? req.files['photo_celular'][0] : null;

    // Validação para garantir que todos os campos necessários foram enviados
    if (!title || !photoNormalFile || !photoCelularFile) {
      // Se algum arquivo já foi salvo, remove para não deixar lixo no servidor
      if (photoNormalFile) fs.unlinkSync(photoNormalFile.path);
      if (photoCelularFile) fs.unlinkSync(photoCelularFile.path);
      return res.status(400).json({ error: 'Título e as duas imagens (normal e celular) são obrigatórios.' });
    }

    const photoNormal = photoNormalFile.filename;
    const photoCelular = photoCelularFile.filename;

    // Usar uma transaction para garantir que ambos os banners sejam criados com sucesso
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const stmt = db.prepare('INSERT INTO banners (title, photo, type) VALUES (?, ?, ?)');

      // Inserir banner normal (desktop)
      stmt.run(title, photoNormal, 'normal', function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao adicionar o banner normal.' });
        }
      });

      // Inserir banner para celular
      stmt.run(title, photoCelular, 'celular', function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao adicionar o banner para celular.' });
        }
      });

      // Finaliza e comita a transaction
      stmt.finalize((err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Erro ao finalizar a criação dos banners.' });
        }
        db.run('COMMIT');
        res.status(201).json({
          message: 'Banners (normal e celular) adicionados com sucesso.'
        });
      });
    });
  }
);

// ROTA ADMIN - Ver todos os banners (ativos e inativos)
router.get('/all', authMiddleware, adminMiddleware, (req, res) => {
  db.all('SELECT * FROM banners ORDER BY created_at DESC', (err, banners) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar todos os banners.' });
    }
    res.json(banners);
  });
});

// ROTA ADMIN - Ativar/Desativar banner
router.patch('/:id/toggle', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT is_active FROM banners WHERE id = ?', [id], (err, banner) => {
    if (err || !banner) {
      return res.status(404).json({ error: 'Banner não encontrado.' });
    }

    const newStatus = !banner.is_active;

    db.run(
      'UPDATE banners SET is_active = ? WHERE id = ?',
      [newStatus ? 1 : 0, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: 'Erro ao atualizar status do banner.' });
        }
        res.json({
          message: `Banner ${newStatus ? 'ativado' : 'desativado'} com sucesso.`,
          is_active: newStatus
        });
      }
    );
  });
});

// ROTA ADMIN - Remover banner
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  db.get('SELECT photo FROM banners WHERE id = ?', [id], (err, banner) => {
    if (err || !banner) {
      return res.status(404).json({ error: 'Banner não encontrado.' });
    }

    // Deleta o arquivo de imagem da pasta uploads
    if (banner.photo) {
      const photoPath = path.join(__dirname, '..', 'uploads', 'banners', banner.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Deleta o registro do banner do banco de dados
    db.run('DELETE FROM banners WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao remover o banner do banco de dados.' });
      }
      res.json({ message: 'Banner removido com sucesso.' });
    });
  });
});

module.exports = router;