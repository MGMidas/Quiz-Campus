const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

const server = http.createServer(app);
const io = new Server(server);

const { pool, initDB } = require('./data/db');

app.use(express.json());

// Routes auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const authMiddleware = require('./middleware/authMiddleware');

// Routes quiz (MariaDB)
app.post('/api/quizzes', authMiddleware, async (req, res) => {
    try {
        const { titre, questions } = req.body;

        // --- VALIDATION ROBUSTE ---
        if (!titre || typeof titre !== 'string' || titre.trim().length === 0) {
            return res.status(400).json({ message: "Le titre du quiz est obligatoire." });
        }
        if (titre.length > 100) {
            return res.status(400).json({ message: "Le titre est trop long (max 100 caractères)." });
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Le quiz doit contenir au moins une question." });
        }
        if (questions.length > 50) {
            return res.status(400).json({ message: "Le quiz ne peut pas dépasser 50 questions." });
        }

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qNum = i + 1;

            if (!q.texte || typeof q.texte !== 'string' || q.texte.trim().length === 0) {
                return res.status(400).json({ message: `Texte manquant pour la question ${qNum}.` });
            }
            if (q.texte.length > 500) {
                return res.status(400).json({ message: `Le texte de la question ${qNum} est trop long.` });
            }

            if (!Number.isInteger(q.timer) || q.timer < 5 || q.timer > 300) {
                return res.status(400).json({ message: `Le timer de la question ${qNum} doit être entre 5 et 300 secondes.` });
            }

            if (!Array.isArray(q.reponses) || q.reponses.length !== 4) {
                return res.status(400).json({ message: `La question ${qNum} doit avoir exactement 4 réponses.` });
            }

            for (let j = 0; j < 4; j++) {
                if (!q.reponses[j] || typeof q.reponses[j] !== 'string' || q.reponses[j].trim().length === 0) {
                    return res.status(400).json({ message: `La réponse ${String.fromCharCode(65 + j)} de la question ${qNum} est vide.` });
                }
                if (q.reponses[j].length > 200) {
                    return res.status(400).json({ message: `La réponse ${String.fromCharCode(65 + j)} de la question ${qNum} est trop longue.` });
                }
            }

            const br = parseInt(q.bonneReponse);
            if (isNaN(br) || br < 0 || br > 3) {
                return res.status(400).json({ message: `Bonne réponse invalide pour la question ${qNum}.` });
            }
        }
        // --- FIN VALIDATION ---

        const [result] = await pool.execute(
            "INSERT INTO quizzes (userId, titre) VALUES (?, ?)",
            [req.user.id, titre.trim()]
        );
        const quizId = result.insertId;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const [qResult] = await pool.execute(
                "INSERT INTO questions (quizId, texte, timer, bonne_reponse, ordre) VALUES (?, ?, ?, ?, ?)",
                [quizId, q.texte.trim(), q.timer, parseInt(q.bonneReponse), i]
            );
            const questionId = qResult.insertId;
            for (let j = 0; j < 4; j++) {
                await pool.execute(
                    "INSERT INTO reponses (questionId, texte, reponse_index) VALUES (?, ?, ?)",
                    [questionId, q.reponses[j].trim(), j]
                );
            }
        }

        const newQuiz = { id: quizId, userId: req.user.id, titre: titre.trim(), questions };
        res.status(201).json(newQuiz);
    } catch (error) {
        console.error("Erreur sauvegarde quiz:", error);
        res.status(500).json({ message: "Erreur lors de la sauvegarde du quiz." });
    }
});

app.get('/api/quizzes', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            "SELECT id, userId, titre FROM quizzes WHERE userId = ? ORDER BY created_at DESC",
            [req.user.id]
        );

        const quizzes = [];
        for (const row of rows) {
            const [questionRows] = await pool.execute(
                "SELECT id, texte, timer, bonne_reponse FROM questions WHERE quizId = ? ORDER BY ordre ASC",
                [row.id]
            );
            const questions = [];
            for (const qRow of questionRows) {
                const [reponseRows] = await pool.execute(
                    "SELECT texte FROM reponses WHERE questionId = ? ORDER BY reponse_index ASC",
                    [qRow.id]
                );
                questions.push({
                    texte: qRow.texte,
                    timer: qRow.timer,
                    bonneReponse: qRow.bonne_reponse,
                    reponses: reponseRows.map(r => r.texte)
                });
            }
            quizzes.push({
                id: row.id.toString(),
                userId: row.userId,
                titre: row.titre,
                questions
            });
        }
        res.json(quizzes);
    } catch (error) {
        console.error("Erreur chargement quiz:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des quiz." });
    }
});

app.delete('/api/quizzes/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await pool.execute(
            "DELETE FROM quizzes WHERE id = ? AND userId = ?",
            [req.params.id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Quiz non trouvé." });
        }
        res.json({ message: "Quiz supprimé avec succès." });
    } catch (error) {
        console.error("Erreur suppression quiz:", error);
        res.status(500).json({ message: "Erreur lors de la suppression." });
    }
});

app.put('/api/quizzes/:id', authMiddleware, async (req, res) => {
    try {
        const { titre, questions } = req.body;

        // Validation identique au POST
        if (!titre || typeof titre !== 'string' || titre.trim().length === 0) {
            return res.status(400).json({ message: "Le titre du quiz est obligatoire." });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "Le quiz doit contenir au moins une question." });
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.texte || typeof q.texte !== 'string' || q.texte.trim().length === 0) {
                return res.status(400).json({ message: `Texte manquant pour la question ${i + 1}.` });
            }
            if (!Array.isArray(q.reponses) || q.reponses.length !== 4 || q.reponses.some(r => !r || typeof r !== 'string')) {
                return res.status(400).json({ message: `Réponses invalides pour la question ${i + 1}.` });
            }
            const br = parseInt(q.bonneReponse);
            if (isNaN(br) || br < 0 || br > 3) {
                return res.status(400).json({ message: `Bonne réponse invalide pour la question ${i + 1}.` });
            }
        }

        const [quizRows] = await pool.execute(
            "SELECT id FROM quizzes WHERE id = ? AND userId = ?",
            [req.params.id, req.user.id]
        );
        if (quizRows.length === 0) {
            return res.status(404).json({ message: "Quiz non trouvé." });
        }

        await pool.execute("UPDATE quizzes SET titre = ? WHERE id = ?", [titre.trim(), req.params.id]);

        await pool.execute("DELETE FROM questions WHERE quizId = ?", [req.params.id]);

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const [qResult] = await pool.execute(
                "INSERT INTO questions (quizId, texte, timer, bonne_reponse, ordre) VALUES (?, ?, ?, ?, ?)",
                [req.params.id, q.texte.trim(), q.timer, parseInt(q.bonneReponse), i]
            );
            const questionId = qResult.insertId;
            for (let j = 0; j < 4; j++) {
                await pool.execute(
                    "INSERT INTO reponses (questionId, texte, reponse_index) VALUES (?, ?, ?)",
                    [questionId, q.reponses[j].trim(), j]
                );
            }
        }
        res.json({ message: "Quiz mis à jour avec succès." });
    } catch (error) {
        console.error("Erreur mise à jour quiz:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour." });
    }
});

const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    next();
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Client/accueil.html'));
});
app.use(express.static(path.join(__dirname, '../Client')));

const games = {};

function generatePIN() {
    let pin;
    do {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
    } while (games[pin]);
    return pin;
}

io.on('connection', (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    socket.on('host_create_game', (quizData) => {
        const pin = generatePIN();
        games[pin] = {
            pin,
            hostSocketId: socket.id,
            players: [],
            currentQuiz: quizData,
            status: 'waiting',
            acceptingAnswers: false,
            questionStartTime: null, // Initialisé à null
            currentTimer: 0
        };
        socket.join(pin);
        console.log(`Partie créée. PIN : ${pin}`);
        socket.emit('game_created', { pin });
    });

    socket.on('player_join_game', ({ pin, pseudo, playerId }) => {
        const game = games[pin];
        if (!game) return socket.emit('join_error', 'Code PIN invalide !');

        // Recherche d'un joueur existant (reconnexion)
        let player = game.players.find(p => (playerId && p.playerId === playerId) || p.pseudo === pseudo);

        if (player) {
            // Si le pseudo est le même mais que le playerId est différent, c'est un usurpateur
            if (playerId && player.playerId !== playerId) {
                return socket.emit('join_error', 'Ce pseudo est déjà pris.');
            }
            
            // Reconnexion : on met à jour la socket
            player.id = socket.id;
            socket.join(pin);
            socket.emit('join_success', { pseudo: player.pseudo, pin });
            
            // On renvoie l'état actuel du jeu au joueur qui se reconnecte
            if (game.status === 'playing') {
                const question = game.currentQuiz.questions[game.currentQuestionIndex];
                socket.emit('game_started', {
                    question: question.texte,
                    answers: question.reponses,
                    timer: game.currentTimer,
                    totalPlayers: game.players.length,
                    reconnecting: true,
                    hasAnswered: player.hasAnswered // Indique si le joueur a déjà répondu
                });
                socket.emit('update_player_score', { score: player.score });
            }
            
            console.log(`Reconnexion : ${player.pseudo} sur la partie ${pin}`);
        } else {
            // Nouveau joueur
            if (game.players.find(p => p.pseudo === pseudo)) {
                return socket.emit('join_error', 'Ce pseudo est déjà pris.');
            }
            const newPlayer = { 
                id: socket.id, 
                playerId: playerId || Math.random().toString(36).substr(2, 9),
                pseudo, 
                score: 0, 
                hasAnswered: false, 
                pin 
            };
            game.players.push(newPlayer);
            socket.join(pin);
            socket.emit('join_success', { pseudo, pin, playerId: newPlayer.playerId });
            console.log(`Nouveau joueur : ${pseudo} sur la partie ${pin}`);
        }

        io.to(game.hostSocketId).emit('player_list_update', game.players);
    });

    socket.on('host_start_game', ({ pin }) => {
        const game = games[pin];
        if (!game || socket.id !== game.hostSocketId) return;
        game.status = 'playing';
        game.currentQuestionIndex = 0;
        game.acceptingAnswers = true;
        game.questionStartTime = Date.now(); // On démarre le chrono ici
        const question = game.currentQuiz.questions[0];
        game.currentTimer = question.timer;
        io.to(pin).emit('game_started', {
            question: question.texte,
            answers: question.reponses,
            timer: question.timer,
            totalPlayers: game.players.length
        });
    });

    socket.on('host_next_question', ({ pin }) => {
        const game = games[pin];
        if (!game || socket.id !== game.hostSocketId) return;
        game.currentQuestionIndex++;
        if (game.currentQuestionIndex < game.currentQuiz.questions.length) {
            game.players.forEach(p => p.hasAnswered = false);
            game.acceptingAnswers = true;
            game.questionStartTime = Date.now();
            const question = game.currentQuiz.questions[game.currentQuestionIndex];
            game.currentTimer = question.timer;
            io.to(pin).emit('next_question', {
                question: question.texte,
                answers: question.reponses,
                timer: question.timer,
                totalPlayers: game.players.length
            });
        }
    });

    socket.on('player_submit_answer', ({ pin, answerIndex }) => {
        const game = games[pin];
        if (!game || game.status !== 'playing') return;
        if (!game.acceptingAnswers) {
            return socket.emit('answer_result', { error: true, message: "Temps écoulé !" });
        }
        const player = game.players.find(p => p.id === socket.id);
        if (!player || player.hasAnswered) return;
        const question = game.currentQuiz.questions[game.currentQuestionIndex];
        const isCorrect = answerIndex.toString() === question.bonneReponse.toString();
        player.hasAnswered = true;
        if (!game.lastAnswers) game.lastAnswers = {};
        game.lastAnswers[socket.id] = answerIndex.toString();
        if (isCorrect) {
            const elapsed = (Date.now() - game.questionStartTime) / 1000;
            const ratio = Math.max(0, 1 - elapsed / game.currentTimer);
            const points = Math.floor(ratio * 1000);
            player.score += points;
            socket.emit('answer_result', { isCorrect: true, correctAnswerIndex: question.bonneReponse, points });
        } else {
            socket.emit('answer_result', { isCorrect: false, correctAnswerIndex: question.bonneReponse, points: 0 });
        }
        const totalAnswered = game.players.filter(p => p.hasAnswered).length;
        io.to(game.hostSocketId).emit('update_response_count', { answered: totalAnswered, total: game.players.length });
        if (totalAnswered === game.players.length) {
            game.acceptingAnswers = false;
            game.players.forEach(p => {
                io.to(p.id).emit('update_player_score', { score: p.score });
            });
            io.to(game.hostSocketId).emit('all_players_answered');
            const q = game.currentQuiz.questions[game.currentQuestionIndex];
            const totalCorrect2 = game.players.filter(p => p.hasAnswered && game.lastAnswers?.[p.id] === q.bonneReponse).length;
            const totalWrong2 = totalAnswered - totalCorrect2;
            const percentCorrect2 = totalAnswered > 0 ? Math.round((totalCorrect2 / totalAnswered) * 100) : 0;
            const isLast2 = game.currentQuestionIndex >= game.currentQuiz.questions.length - 1;
            setTimeout(() => {
                io.to(game.hostSocketId).emit('answer_reveal', {
                    correctAnswerIndex: q.bonneReponse,
                    answers: q.reponses,
                    totalAnswered,
                    totalCorrect: totalCorrect2,
                    totalWrong: totalWrong2,
                    percentCorrect: percentCorrect2,
                    isLastQuestion: isLast2
                });
            }, 500);
        }
    });

    socket.on('host_time_up', ({ pin }) => {
        const game = games[pin];
        if (!game || socket.id !== game.hostSocketId) return;
        game.acceptingAnswers = false;
        const question = game.currentQuiz.questions[game.currentQuestionIndex];
        const totalAnswered = game.players.filter(p => p.hasAnswered).length;
        const totalCorrect = game.players.filter(p => p.hasAnswered && game.lastAnswers?.[p.id] === question.bonneReponse).length;
        game.players.forEach(p => {
            if (!p.hasAnswered) {
                io.to(p.id).emit('answer_result', { isCorrect: false, timeout: true, correctAnswerIndex: question.bonneReponse });
            }
            io.to(p.id).emit('update_player_score', { score: p.score });
        });
        const totalWrong = totalAnswered - totalCorrect;
        const percentCorrect = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
        const isLast = game.currentQuestionIndex >= game.currentQuiz.questions.length - 1;
        io.to(game.hostSocketId).emit('answer_reveal', {
            correctAnswerIndex: question.bonneReponse,
            answers: question.reponses,
            totalAnswered,
            totalCorrect,
            totalWrong,
            percentCorrect,
            isLastQuestion: isLast
        });
    });

    socket.on('host_show_leaderboard', ({ pin, final }) => {
        const game = games[pin];
        if (!game || socket.id !== game.hostSocketId) return;
        const leaderboard = game.players.map(p => ({ pseudo: p.pseudo, score: p.score }));
        if (final) {
            game.status = 'finished';
            game.acceptingAnswers = false;
            io.to(pin).emit('quiz_ended', { leaderboard });
        } else {
            io.to(game.hostSocketId).emit('show_leaderboard', { leaderboard });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Déconnexion : ${socket.id}`);
        for (const pin in games) {
            const game = games[pin];
            if (socket.id === game.hostSocketId) {
                io.to(pin).emit('game_terminated', "L'animateur a quitté la partie.");
                delete games[pin];
                break;
            } else {
                const idx = game.players.findIndex(p => p.id === socket.id);
                if (idx !== -1) {
                    // On ne supprime plus le joueur pour permettre la reconnexion
                    console.log(`Joueur déconnecté (en attente) : ${game.players[idx].pseudo}`);
                    io.to(game.hostSocketId).emit('player_list_update', game.players);
                    break;
                }
            }
        }
    });
});

initDB().then(() => {
    const HOST = process.env.IP || '0.0.0.0';
    server.listen(PORT, HOST, () => {
        console.log(`Serveur HTTP sur http://${HOST}:${PORT}`);
    });
});