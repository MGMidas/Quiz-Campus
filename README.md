# Quiz-Campus 🎯

**[🚀 Voir la démo en direct](https://fache.alwaysdata.net)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-blue)](https://socket.io/)

Quiz-Campus est une plateforme de quiz interactive en temps réel, conçue pour transformer l'apprentissage en une expérience ludique et engageante. Que vous soyez un formateur, un enseignant ou simplement entre amis, Quiz-Campus vous permet de créer, d'animer et de participer à des quiz dynamiques.

<p align="center">
  <img src="Client/asset/Logo.png" alt="Quiz-Campus Logo" width="200">
</p>

---

## 📸 Aperçu

### Accueil & Présentation
![Accueil](Client/asset/Screenshot%202026-06-12%20at%2014-09-14%20QuizCampus%20—%20Accueil.png)

### À propos & Mission
![À propos](Client/asset/Screenshot%202026-06-12%20at%2014-10-35%20À%20propos%20—%20QuizCampus.png)

### Inscription Animateur
![Inscription](Client/asset/Screenshot%202026-06-12%20at%2014-11-08%20Inscription%20—%20QuizCampus.png)

---

## ✨ Fonctionnalités

### 👑 Pour l'Animateur (Host)
- **Gestion de compte** : Inscription et connexion sécurisées via JWT.
- **Création de Quiz** : Interface intuitive pour créer des quiz personnalisés avec 4 options de réponse.
- **Contrôle en temps réel** : Lancement des sessions, passage des questions et gestion du timer.
- **Statistiques en direct** : Visualisation du nombre de réponses et des résultats après chaque question.
- **Podium interactif** : Célébration des gagnants avec un classement final dynamique.

### 🎮 Pour le Joueur
- **Accès rapide** : Rejoignez une partie instantanément avec un code PIN et un pseudo.
- **Interface Pad** : Manette colorée (Rouge, Bleu, Jaune, Vert) optimisée pour mobile et desktop.
- **Feedback instantané** : Résultats immédiats après chaque question avec calcul des points basé sur la rapidité.

---

## 🚀 Technologies

### Frontend
- **HTML5 / CSS3** (Vanilla, sans framework pour une légèreté maximale)
- **JavaScript ES6+** (DOM manipulation)
- **Socket.io Client** (Communication temps réel)
- **Thème Sombre/Clair** (Persistance via LocalStorage)

### Backend
- **Node.js & Express** (Serveur et API REST)
- **Socket.io Server** (Gestion des salons et de la logique de jeu)
- **MariaDB** (Stockage persistant des utilisateurs et des quiz)
- **JWT (JSON Web Token)** (Authentification sécurisée)
- **Bcrypt** (Hachage des mots de passe)

---

## 🛠️ Installation et Lancement

### Prérequis
- [Node.js](https://nodejs.org/) (v14+)
- [MariaDB](https://mariadb.org/) ou MySQL

### Étapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/MGMidas/Quiz-Campus.git
   cd Quiz-Campus
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer l'environnement**
   Créez un fichier `.env` à la racine (utilisez `.env.example` comme modèle) :
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=quizmaster
   JWT_SECRET=votre_secret_super_securise
   ```

4. **Initialiser la base de données**
   Assurez-vous que MariaDB est lancé. Le serveur initialisera les tables automatiquement au premier lancement.

5. **Lancer le serveur**
   ```bash
   npm start
   ```
   L'application sera accessible sur `http://localhost:3000`.

---

## 🏗️ Architecture

```
Quiz-Campus/
├── Client/           # Frontend (HTML, CSS, JS)
│   ├── asset/        # Images et screenshots
│   ├── js/           # Logique client (Socket.io & API)
│   └── Styles/       # Design responsive & Thèmes
├── server/           # Backend (Node.js & Express)
│   ├── data/         # Configuration MariaDB
│   ├── middleware/   # Sécurité & Authentification
│   └── routes/       # API Endpoints
└── question_backend.txt # Guide technique pour les oraux/présentations
```

---

## 👨‍💻 Auteur
**MGMidas** - [GitHub](https://github.com/MGMidas)

Projet réalisé dans le cadre d'une formation en développement web, mettant l'accent sur les technologies temps réel et l'architecture Fullstack.

---

## ⚖️ Licence
Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.
