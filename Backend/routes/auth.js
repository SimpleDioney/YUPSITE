const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../database/db");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");

// Registro
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Nome é obrigatório"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Senha deve ter no mínimo 6 caracteres"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(
        "INSERT INTO users (name, email, password, phone, address) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, phone, address],
        function (err) {
          if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
              return res.status(400).json({ error: "Email já cadastrado" });
            }
            return res.status(500).json({ error: "Erro ao criar usuário" });
          }

          const token = jwt.sign(
            { id: this.lastID, email, is_admin: false },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          res.status(201).json({
            message: "Usuário criado com sucesso",
            token,
            user: { id: this.lastID, name, email },
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: "Erro ao processar registro" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Senha é obrigatória"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, is_admin: user.is_admin },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login bem-sucedido",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_admin: user.is_admin,
        },
      });
    });
  }
);

// Update user data
router.put("/user/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: "Acesso negado." });
  }

  db.run(
    "UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
    [name, email, phone, address, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Erro ao atualizar usuário" });
      }
      db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao buscar usuário" });
        }
        res.json({
          message: "Usuário atualizado com sucesso",
          user,
        });
      });
    }
  );
});

// Update user password
router.put("/user/:id/password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: "Acesso negado." });
  }

  db.get("SELECT * FROM users WHERE id = ?", [id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Senha atual incorreta" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id],
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Erro ao atualizar senha" });
        }
        res.json({ message: "Senha atualizada com sucesso" });
      }
    );
  });
});

module.exports = router;