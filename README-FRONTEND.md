# Frontend — QuizCampus

## Structure des fichiers

```
Client/
├── accueil.html          # Page d'accueil (landing page)
├── connexion.html        # Connexion animateur
├── inscription.html      # Création de compte animateur
├── rejoindre.html        # Rejoindre une partie (joueur)
├── host.html             # Dashboard animateur (quiz, salon, jeu)
├── joueur.html           # Interface joueur (manette de réponse)
│
├── Styles/
│   ├── accueil.css       # Styles de la page d'accueil
│   ├── connexion.css     # Styles des pages auth (connexion + inscription)
│   ├── rejoindre.css     # Styles de la page rejoindre
│   ├── host.css          # Styles du dashboard animateur
│   └── joueur.css        # Styles de l'interface joueur
│
├── js/
│   ├── login.js          # Logique du formulaire de connexion
│   ├── register.js       # Logique du formulaire d'inscription
│   ├── player.js         # Logique joueur (Socket.IO)
│   └── host.js           # Logique animateur (Socket.IO + API)
│
└── asset/
    └── Logo.png          # Logo du site
```

---

## Navigation entre les pages

```
                    ┌──────────────────┐
                    │    accueil.html   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     rejoindre.html   connexion.html   inscription.html
     (joueur)         (animateur)      (créer compte)
              │              │              │
              ▼              ▼              ▼
        joueur.html      host.html     connexion.html
     (manette jeu)   (dashboard quiz)   (redirection)
```

- **accueil.html** → liens vers rejoindre, connexion, inscription
- **rejoindre.html** → le joueur entre un PIN et un pseudo → redirigé vers **joueur.html**
- **connexion.html** → l'animateur se connecte → redirigé vers **host.html**
- **inscription.html** → création de compte → redirigé vers **connexion.html**

---

## Fichiers HTML

### accueil.html
Page d'accueil avec :
- Navbar : logo, Connexion, Inscription, bouton thème, menu mobile
- Hero section : logo + titre + bouton "Jouer" → lien vers rejoindre.html
- Cards : Temps Réel, Multi-joueurs, Personnalisable
- Section "Apprendre Interagir Progresser" : texte de présentation
- Section "Comment ça marche ?" : 3 étapes (Créer, Partager, Jouer)
- Section "Qui sommes-nous / Qui suis-je ?" : présentation du projet et du développeur
- Stack technique : liste des technologies utilisées (HTML, CSS, JS, Socket.io, Node.js, Express, MariaDB)
- Section "À propos" : description + lien GitHub
- Footer : liens Jouer, Connexion, Inscription, GitHub
- Thème sombre/clair inline (pas de fichier JS externe)
- Menu mobile hamburger

### connexion.html
Formulaire de connexion animateur avec :
- Champ email
- Champ mot de passe
- Validation côté client (email avec @, mot de passe non vide)
- Erreurs visuelles (bordures rouges, messages d'erreur)
- Toast de notification (succès/erreur)
- Lien vers inscription.html
- Bouton retour vers accueil.html

### inscription.html
Formulaire de création de compte avec :
- Champ email
- Champ mot de passe (min 6 caractères)
- Champ confirmation mot de passe
- Validation : email valide, mot de passe 6+ caractères, confirmation identique
- Toast de notification
- Lien vers connexion.html

### rejoindre.html
Page pour rejoindre une partie avec :
- Champ code PIN
- Champ pseudo
- Bouton Valider → envoie les infos au serveur via Socket.IO
- Toast d'erreur
- Liens vers connexion.html et inscription.html

### host.html
Dashboard animateur complet avec 7 écrans :

1. **Écran A — Sélection de quiz** : liste des quiz sauvegardés, bouton créer
2. **Écran B — Création de quiz** : titre du quiz, éditeur de questions (4 réponses A/B/C/D), timer, bonne réponse, liste des questions
3. **Écran C — Salon d'attente** : code PIN affiché, liste des joueurs connectés, bouton lancer
4. **Écran D — Jeu en direct** : question affichée, timer qui décompte, zone des réponses, compteur de réponses
5. **Écran E — Révélation** : statistiques (ont répondu, bonnes réponses, mauvaises), bouton voir classement
6. **Écran F — Classement** : classement des joueurs avec scores, bouton question suivante / podium final
7. **Écran G — Podium final** : top 3 avec médailles, classement des autres, bouton retour

### joueur.html
Interface du joueur avec 3 écrans :
- **Attente** : "Tu es connecté !" avec spinner, en attente du lancement
- **Jeu** : 4 boutons colorés (▲ rouge, ♦ bleu, ● jaune, ■ vert) pour répondre
- **Feedback** : "CORRECT !" ou "DOMMAGE..." avec points ou correction

---

## Fichiers CSS

### accueil.css
- Définit les variables CSS globales (couleurs, thème sombre/clair)
- Styles de la navbar, menu mobile, boutons (.btn-primary, .btn-outline)
- Hero, cards, présentation, stack technique, footer
- Section "Comment ça marche ?" avec les 3 étapes numérotées
- Section "À propos"
- Responsive : un seul breakpoint à 768px

### connexion.css
- Partagé entre connexion.html et inscription.html
- Centrage vertical de la carte auth
- Carte auth (.auth-card) avec glassmorphism
- Inputs, labels, messages d'erreur (.error-msg.visible)
- Bouton orange (.btn-auth)
- Toast de notification (.toast.visible)
- Bouton retour positionné en haut à gauche
- Theme toggle en haut à droite (.theme-btn-wrap)
- Responsive à 768px

### rejoindre.css
- Même structure que connexion.css
- Ajoute .auth-divider avec lignes de séparation
- Mêmes classes pour inputs, boutons, toasts

### host.css
- Header animateur avec logo, email, logout
- Grille des quiz (.quiz-grid)
- Builder de quiz avec 4 réponses colorées (rouge, bleu, jaune, vert)
- Salon d'attente avec code PIN en grand
- Écran de jeu avec timer et grille de réponses
- Révélation avec statistiques
- Classement et podium
- Boutons .btn-action (orange) et .btn-secondary (bleu)
- Responsive à 768px

### joueur.css
- Header du joueur (pseudo, score, thème)
- Écran d'attente avec spinner statique (pas d'animation)
- Grille de jeu 2x2 (pad-grid) avec boutons colorés
- Écran de feedback (correct/incorrect)
- Responsive à 768px

---

## Fichiers JS

### login.js
- Cible les éléments : email, password, btn-submit, btn-text, toast, erreurs
- Fonction `validate()` : vérifie email non vide avec @, mot de passe non vide
- Fonction `showToast(msg, type)` : affiche une notification (success/error)
- Fonction `hideToast()` : cache la notification
- Fonction `clearErrors()` : enlève les classes d'erreur
- Au clic sur le bouton : valide → fetch POST `/api/auth/login` → reçoit token → stocke dans localStorage → redirige vers host.html
- Enter sur les inputs déclenche le clic du bouton

### register.js
- Même structure que login.js, ajoute le champ confirmation
- `validate()` vérifie : email valide, mot de passe 6+ car., confirmation identique
- Fetch POST `/api/auth/register` → redirige vers connexion.html

### player.js
- Connexion Socket.IO avec `io()`
- Bouton Valider sur rejoindre.html : émet `player_join_game` avec PIN + pseudo
- Réception `join_success` : stocke PIN et pseudo dans sessionStorage → redirige vers joueur.html
- Sur joueur.html : se reconnecte automatiquement avec les infos stockées
- Réception `join_error` : affiche l'erreur ou redirige
- Réception `game_started` et `next_question` : affiche la question (écran jeu ou attente)
- Clic sur un pad : émet `player_submit_answer` → passe en écran attente
- Réception `answer_result` : affiche CORRECT ou DOMMAGE avec points
- Réception `update_player_score` : met à jour le score affiché
- Réception `quiz_ended` : affiche "Quiz Terminé !"
- Réception `game_terminated` : affiche message et bouton retour

### host.js
- Connexion Socket.IO avec `io()`
- Vérifie la présence du token JWT dans localStorage → redirige vers connexion.html si absent
- Fonctions API :
  - `getUserEmail()` : fetch GET `/api/auth/me` → affiche l'email
  - `loadQuizzes()` : fetch GET `/api/quizzes` → remplit la grille
  - `deleteQuizFromServer(id)` : fetch DELETE `/api/quizzes/:id`
  - `openEditQuiz(id)` : charge un quiz pour modification
- Builder de quiz :
  - `renderQuestionList()` : affiche les pastilles des questions
  - `editQuestion(index)` : charge une question dans le formulaire
  - `deleteQuestion(index)` : supprime une question
  - Bouton "Valider la question" : ajoute ou met à jour une question
  - Bouton "Enregistrer" : fetch POST ou PUT `/api/quizzes`
- Événements Socket.IO émis :
  - `host_create_game` : création d'une partie avec un quiz
  - `host_start_game` : démarrage de la partie
  - `host_time_up` : temps écoulé (fin de question)
  - `host_show_leaderboard` : affichage du classement
  - `host_next_question` : passage à la question suivante
- Événements Socket.IO reçus :
  - `game_created` : reçoit le PIN → affiche salon d'attente
  - `player_list_update` : met à jour la liste des joueurs
  - `game_started` / `next_question` : affiche la question avec timer
  - `answer_reveal` : affiche les statistiques de la question
  - `show_leaderboard` : affiche le classement
  - `quiz_ended` : affiche le podium final
  - `update_response_count` : met à jour le compteur de réponses

---

## Flux de données

### Authentification (animateur)
```
Inscription → POST /api/auth/register → redirection connexion.html
Connexion → POST /api/auth/login → reçoit token → localStorage → host.html
host.html → GET /api/auth/me (vérifie token) → GET /api/quizzes
```

### Quiz (CRUD)
```
Créer quiz → POST /api/quizzes → sauvegarde + retour à la liste
Modifier quiz → PUT /api/quizzes/:id → mise à jour
Supprimer quiz → DELETE /api/quizzes/:id → suppression
```

### Partie en temps réel (Socket.IO)
```
Hôte crée une partie → émet 'host_create_game' → reçoit PIN
Joueur rejoint → émet 'player_join_game' → reçoit confirmation
Hôte lance → émet 'host_start_game' → tous reçoivent 'game_started'
Joueur répond → émet 'player_submit_answer' → compteur mis à jour
Temps écoulé → hôte émet 'host_time_up' → révélation + scores + classement
Dernière question → podium final + fin de partie
```

---

## Thème sombre/clair
- Stocké dans localStorage (clé : "theme")
- Valeurs possibles : "dark" ou "light" (par défaut)
- Attribut `data-theme="dark"` sur `<html>` pour le mode sombre
- Variables CSS dans `:root` (clair) et `[data-theme="dark"]` (sombre)
- Palette : bleu (#1A5FBF) et orange (#F7A800) dans les deux thèmes
- Bouton thème inline dans chaque page (pas de fichier JS externe)

## Design system
- Police : Inter (Google Fonts)
- Boutons : angles droits (border-radius: 0)
- Pas d'animations CSS
- Cards avec glassmorphism (background semi-transparent, bordure)
- Un seul breakpoint responsive : 768px
