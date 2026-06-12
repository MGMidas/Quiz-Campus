const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../data/db");

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function authRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  const timestamps = rateLimitMap.get(ip).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({ message: "Trop de tentatives. Réessayez dans 15 minutes." });
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  next();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 6) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Format d'email invalide" });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une lettre et un chiffre" });
    }

    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(409).json({ message: "cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword]);

    return res.status(201).json({ message: "ressource créée avec succès" });
  } catch (err) {
    console.error("Erreur register:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/login", authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Format d'email invalide" });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "utilisateur introuvable" });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    return res.status(200).json({ message: "connexion réussie", token });
  } catch (err) {
    console.error("Erreur login:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Token invalide" });
        req.user = decoded;
        next();
    });
}

router.get("/me", verifyToken, (req, res) => {
    return res.status(200).json({ id: req.user.id, email: req.user.email });
});

module.exports = router;
