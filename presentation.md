# QuizCampus 🎯

## Une plateforme de quiz interactive & temps réel

---

## Sommaire

1. **Présentation du projet**
2. **Technologies utilisées**
3. **Fonctionnalités**
4. **Architecture de l'application**
5. **Parcours utilisateur**
6. **Flux de données en temps réel**
7. **État d'avancement**
8. **Perspectives**
9. **Lexique technique**

---

## 1. Présentation du projet

 

---

## 2. Technologies utilisées

### Frontend

| Technologie       | Utilisation                     |
| ----------------- | ------------------------------- |
| **HTML5**         | Structure des pages             |
| **CSS3**          | Thème light/dark, responsive |
| **JavaScript ES6**| Logique métier (vanilla, sans framework) |
| **Socket.IO**     | Communication temps réel        |
| **Font Awesome**  | Icônes                          |
| **Google Fonts (Inter)** | Typographie              |

### Backend (en cours)

| Technologie       | Utilisation                     |
| ----------------- | ------------------------------- |
| **Node.js**       | Serveur                         |
| **Express**       | API REST                        |
| **Socket.IO**     | WebSockets                      |
| **MariaDB**       | Base de données                 |
| **JWT**           | Authentification                |

---

## 3. Fonctionnalités

### Côté Animateur (Host)

- [x] Inscription / Connexion sécurisée (JWT)
- [x] Création de quiz avec questions à choix multiples
- [x] Édition et suppression de quiz
- [x] Lancement d'une session de jeu
- [x] Minuteur visuel par question (10/20/30/60s)
- [x] Affichage des réponses en temps réel
- [x] Classement après chaque question
- [x] Podium final (Top 3)

### Côté Joueur

- [x] Rejoindre une partie via code PIN + pseudo
- [x] Interface pad coloré (rouge, bleu, jaune, vert)
- [x] Feedback visuel après chaque réponse
- [x] Score en direct

### Général

- [x] Thème **clair / sombre** (persistant)
- [x] Design **responsive** (mobile & desktop)

- [x] Notifications **toast** (non-bloquantes)

---

## 4. Architecture de l'application

```
QuizMaster/
│
├── Client/                       # Frontend
│   ├── accueil.html              # Page d'accueil
│   ├── connexion.html            # Connexion hôte
│   ├── inscription.html          # Inscription hôte
│   ├── rejoindre.html            # Rejoindre une partie
│   ├── host.html                 # Dashboard hôte (7 écrans)
│   ├── joueur.html               # Interface joueur (3 écrans)
│   ├── Styles/                   # Fichiers CSS
│   └── js/                       # Scripts JavaScript
│       ├── login.js
│       ├── register.js
│       ├── host.js               # ~500 lignes
│       └── player.js             # ~160 lignes
│
└── server/                       # Backend (à implémenter)
    └── server.js                 # Serveur Node.js + Socket.IO
```

### Architecture frontend (SPA-like)

Chaque page utilise un système de **sections cachées/affichées** via `classList.add/remove('hidden')` :

- **host.html** : 7 écrans (sélection → éditeur → salon → jeu → révélation → classement → podium)
- **joueur.html** : 3 écrans (attente → pad → feedback)

> Aucun framework JavaScript — tout est en **Vanilla JS** (choix délibéré pour un projet de formation).

---

## 5. Parcours utilisateur

### Animateur

```
Inscription
    ↓
Connexion → JWT stocké dans localStorage
    ↓
Dashboard → Créer / modifier / supprimer des quiz
    ↓
Sélection d'un quiz → Lancer la partie
    ↓
Code PIN généré → Partager avec les joueurs
    ↓
Démarrer → Les questions défilent avec timer
    ↓
Révélation → Statistiques de réponses
    ↓
Classement → Podium final
```

### Joueur

```
Page d'accueil → "Rejoindre"
    ↓
Saisir le code PIN + pseudo
    ↓
Rejoindre la salle d'attente
    ↓
Question → Choisir une couleur
    ↓
Feedback (correct / incorrect)
    ↓
Score mis à jour → Prochaine question
    ↓
Podium final
```

---

## 6. Flux de données en temps réel (Socket.IO)

```
HÔTE                                SERVER                              JOUEUR
 │                                    │                                    │
 ├─ host_create_game ───────────────► │                                    │
 │                                    ├─ game_created (PIN) ────────────► │ (tous)
 │◄── game_created (PIN) ────────────┤                                    │
 │                                    │◄── player_join_game ──────────────┤
 │◄── player_joined ─────────────────┤                                    │
 │                                    │                                    │
 ├─ host_start_game ────────────────► │                                    │
 │                                    ├─ game_started ───────────────────► │ (tous)
 │◄── question_started ──────────────┤                                    │
 │                                    │◄── player_submit_answer ──────────┤
 │◄── response_count ────────────────┤                                    │
 │                                    │                                    │
 ├─ host_time_up ───────────────────► │                                    │
 │◄── answer_result ─────────────────┤                                    │
 │◄── leaderboard ───────────────────┤                                    │
 │◄── podium ────────────────────────┤                                    │
```

---

## 7. État d'avancement

| Partie        | Statut       | Détails                                |
| -------------- | ------------ | -------------------------------------- |
| **Frontend**   | ✅ 100%      | Toutes les pages et la logique sont prêtes |
| **Backend**    | ⏳ 0%        | Serveur Node.js à implémenter          |
| **Base de données** | ⏳ 0%   | Schéma MariaDB à créer                 |
| **Déploiement**| ❌ Non       | À prévoir après implémentation backend |

### Ce qu'il reste à faire

1. Implémenter le serveur **Express** avec les routes API
2. Ajouter la couche **Socket.IO** côté serveur
3. Créer la base de données **MariaDB** (utilisateurs, quiz, questions)
4. Gérer l'authentification **JWT** (création et vérification des tokens)
5. Gérer les sessions de jeu côté serveur (salons, PIN, score)

---

## 8. Perspectives

### Améliorations possibles

- 🎨 **Animations CSS** pour fluidifier les transitions
- 📊 **Questions avec images**
- 📱 **Application mobile** (PWA ou native)
- 🏆 **Historique des parties** et statistiques utilisateur
- 🔄 **Mode aléatoire** (questions mélangées)
- 🌐 **Support multilingue**

---

## 9. Lexique technique (pour les questions)

### Socket.IO
Bibliothèque qui permet au navigateur et au serveur de **communiquer en direct** sans recharger la page. Utile pour le chat, les jeux multijoueurs, etc.

Exemple : quand un joueur répond, sa réponse arrive instantanément sur l'écran de l'animateur.

### API REST
Manière de dialoguer avec le serveur via des adresses URL. On utilise :
- `POST` → créer quelque chose (ex: créer un compte)
- `GET` → récupérer des données (ex: lister les quiz)
- `PUT` → modifier quelque chose
- `DELETE` → supprimer quelque chose

### JWT (JSON Web Token)
C'est comme une **carte d'identité numérique**. Quand l'utilisateur se connecte, le serveur lui donne un token (un code secret). Ce code est stocké dans le navigateur et renvoyé à chaque requête pour prouver qui on est.

### localStorage
Espace de stockage dans le navigateur qui **reste même après avoir fermé la fenêtre**. Utilisé ici pour garder la session de l'animateur connecté.

### sessionStorage
Espace de stockage **temporaire** qui se vide quand on ferme l'onglet. Utilisé ici pour les infos du joueur (pseudo, code PIN).

### DOM (Document Object Model)
C'est la **structure de la page HTML** vue par JavaScript. Grâce au DOM, on peut modifier le contenu d'une page sans la recharger.

Exemple : `document.getElementById('titre').textContent = "Nouveau titre"`

### CSS Grid
Système de **grille en CSS** pour disposer des éléments en lignes et colonnes. Utilisé ici pour la grille des quiz et le pavé de couleurs du joueur (2×2).

### Media Query
Technique CSS pour **adapter le site aux différents écrans** (mobile, tablette, desktop).

Exemple : `@media (max-width: 768px)` → si l'écran est plus petit que 768px, on change la mise en page.

### Responsive design
Un site qui s'adapte automatiquement à la **taille de l'écran** (téléphone, tablette, ordinateur).

### PIN (code à 4 chiffres)
Code unique généré aléatoirement pour chaque partie. Les joueurs le saisissent pour rejoindre la bonne session.

---

## Merci de votre attention ! 🎉

[Retour à l'accueil](Client/accueil.html)
