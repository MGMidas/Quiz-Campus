const socket = io();

let currentPin = null;
let allQuizzes = [];
let timerInterval;
let isLastQuestion = false;

const selectionSection = document.getElementById('selection-section');
const creationSection = document.getElementById('creation-section');
const lobbySection = document.getElementById('lobby-section');
const gameSection = document.getElementById('game-section');
const revealSection = document.getElementById('reveal-section');
const leaderboardSection = document.getElementById('leaderboard-section');
const toast = document.getElementById('host-toast');

const token = localStorage.getItem('token');
if (!token) { window.location.href = 'connexion.html'; }

function showToast(msg, type) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} visible`;
}

function hideToast() {
    if (!toast) return;
    toast.className = 'toast';
}

function getUserEmail() {
    fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(res) {
        if (res.status === 401) {
            window.location.href = 'connexion.html';
            return;
        }
        if (res.ok) {
            return res.json().then(function(data) {
                document.getElementById('user-email').textContent = data.email;
            });
        }
    })
}
getUserEmail();

document.getElementById('btn-logout').onclick = () => {
    localStorage.removeItem('token');
    window.location.href = 'connexion.html';
};

function loadQuizzes() {
    fetch('/api/quizzes', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(response) {
        if (response.status === 401) {
            window.location.href = 'connexion.html';
            return;
        }
        return response.json().then(function(quizzes) {
            allQuizzes = quizzes;
            renderQuizList();
            selectionSection.classList.remove('hidden');
        });
    })
}

function deleteQuizFromServer(id) {
    if (!confirm("Es-tu sûr de vouloir supprimer ce quiz ?")) return;
    
    fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(function(res) {
        if (res.ok) {
            showToast("Quiz supprimé", "success");
            loadQuizzes();
        } else {
            showToast("Erreur lors de la suppression", "error");
        }
    })
}

let editingQuizId = null;

function openEditQuiz(id) {
    const quiz = allQuizzes.find(q => q.id === id);
    if (!quiz) return;
    
    editingQuizId = id;
    selectionSection.classList.add('hidden');
    creationSection.classList.remove('hidden');
    
    document.getElementById('titre-quiz').value = quiz.titre;
    tempQuestions = JSON.parse(JSON.stringify(quiz.questions));
    resetQuestionForm();
}

function renderQuizList() {
    const container = document.getElementById('quiz-list');
    const countEl = document.getElementById('quiz-count');
    if (!container) return;

    container.innerHTML = '';
    countEl.textContent = allQuizzes.length;

    if (allQuizzes.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; opacity:0.3;"><h3>Aucun quiz pour le moment</h3><p>Clique sur le bouton en haut pour commencer</p></div>';
        return;
    }

    allQuizzes.forEach(quiz => {
        const div = document.createElement('div');
        div.className = 'quiz-card';
        div.innerHTML = `
            <h3>${quiz.titre}</h3>
            <p>${quiz.questions.length} question(s)</p>
            <div class="card-actions">
                <button class="btn-action btn-launch">Lancer la partie</button>
                <button class="btn-icon" title="Modifier">✏️</button>
                <button class="btn-icon btn-delete-card" title="Supprimer">✕</button>
            </div>
        `;

        const actions = div.querySelector('.card-actions');
        actions.children[0].onclick = (e) => {
            e.stopPropagation();
            selectQuiz(quiz.id);
        };
        actions.children[1].onclick = (e) => {
            e.stopPropagation();
            openEditQuiz(quiz.id);
        };
        actions.children[2].onclick = (e) => {
            e.stopPropagation();
            deleteQuizFromServer(quiz.id);
        };

        container.appendChild(div);
    });
}

window.selectQuiz = function(quizId) {
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (quiz) {
        socket.emit('host_create_game', quiz);
    }
};

let tempQuestions = [];
let currentEditingIndex = null;

function renderQuestionList() {
    const list = document.getElementById('sidebar-q-list');
    const countEl = document.getElementById('q-count');
    if (!list) return;
    
    list.innerHTML = '';
    countEl.textContent = tempQuestions.length;
    
    tempQuestions.forEach((q, i) => {
        const chip = document.createElement('div');
        chip.className = `q-chip ${currentEditingIndex === i ? 'active' : ''}`;
        chip.innerHTML = `
            <span class="q-number">${i + 1}</span>
            <span class="q-text">${q.texte.substring(0, 30)}${q.texte.length > 30 ? '...' : ''}</span>
            <div class="q-actions">
                <button class="q-edit-btn" title="Modifier">✏️</button>
                <button class="q-delete-btn" title="Supprimer">✕</button>
            </div>
        `;
        
        chip.querySelector('.q-edit-btn').onclick = (e) => {
            e.stopPropagation();
            editQuestion(i);
        };
        chip.querySelector('.q-delete-btn').onclick = (e) => {
            e.stopPropagation();
            deleteQuestion(i);
        };
        list.appendChild(chip);
    });
}

function editQuestion(index) {
    currentEditingIndex = index;
    const q = tempQuestions[index];
    
    document.getElementById('question').value = q.texte;
    document.getElementById('timer').value = q.timer;
    document.getElementById('reponse-a').value = q.reponses[0];
    document.getElementById('reponse-b').value = q.reponses[1];
    document.getElementById('reponse-c').value = q.reponses[2];
    document.getElementById('reponse-d').value = q.reponses[3];
    document.getElementById('bonne-reponse').value = q.bonneReponse;
    
    document.getElementById('btn-add-question').textContent = "Mettre à jour la question";
    renderQuestionList();
}

function deleteQuestion(index) {
    tempQuestions.splice(index, 1);
    if (currentEditingIndex === index) {
        resetQuestionForm();
    } else if (currentEditingIndex > index) {
        currentEditingIndex--;
    }
    renderQuestionList();
}

function resetQuestionForm() {
    currentEditingIndex = null;
    document.getElementById('question').value = '';
    document.getElementById('reponse-a').value = '';
    document.getElementById('reponse-b').value = '';
    document.getElementById('reponse-c').value = '';
    document.getElementById('reponse-d').value = '';
    document.getElementById('timer').value = '20';
    document.getElementById('bonne-reponse').value = '0';
    document.getElementById('btn-add-question').textContent = "Valider la question";
    renderQuestionList();
}

document.getElementById('btn-show-create').onclick = () => {
    selectionSection.classList.add('hidden');
    creationSection.classList.remove('hidden');
    tempQuestions = [];
    document.getElementById('titre-quiz').value = '';
    resetQuestionForm();
};

document.getElementById('btn-add-question').onclick = () => {
    const questionData = {
        texte: document.getElementById('question').value.trim(),
        timer: parseInt(document.getElementById('timer').value) || 20,
        reponses: [
            document.getElementById('reponse-a').value.trim(),
            document.getElementById('reponse-b').value.trim(),
            document.getElementById('reponse-c').value.trim(),
            document.getElementById('reponse-d').value.trim()
        ],
        bonneReponse: document.getElementById('bonne-reponse').value
    };

    if (!questionData.texte || questionData.reponses.some(r => !r)) {
        showToast("Remplis tout !", "error");
        return;
    }

    if (currentEditingIndex !== null) {
        tempQuestions[currentEditingIndex] = questionData;
    } else {
        tempQuestions.push(questionData);
    }

    resetQuestionForm();
};

document.getElementById('btn-cancel-create').onclick = () => {
    if (tempQuestions.length > 0 || document.getElementById('titre-quiz').value.trim() !== "") {
        if (!confirm("Quitter sans enregistrer ? Toutes vos modifications seront perdues.")) {
            return;
        }
    }
    editingQuizId = null;
    creationSection.classList.add('hidden');
    selectionSection.classList.remove('hidden');
};

document.getElementById('btn-save-quiz').onclick = function() {
    const titre = document.getElementById('titre-quiz').value.trim();
    if (!titre) { showToast("Donne un titre !", "error"); return; }
    if (tempQuestions.length === 0) { showToast("Ajoute une question !", "error"); return; }

    const url = editingQuizId ? `/api/quizzes/${editingQuizId}` : '/api/quizzes';
    const method = editingQuizId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ titre, questions: tempQuestions })
    })
    .then(function(res) {
        if (res.ok) {
            showToast(editingQuizId ? "Quiz mis à jour !" : "Quiz enregistré !", "success");
            editingQuizId = null;
            loadQuizzes();
            creationSection.classList.add('hidden');
            selectionSection.classList.remove('hidden');
        } else {
            res.json().then(function(errData) {
                showToast("Erreur : " + (errData.message || res.statusText), "error");
            }, function() {
                res.text().then(function(text) {
                    console.error("Réponse serveur (non-JSON):", text);
                    showToast("Erreur serveur (" + res.status + ")", "error");
                });
            });
        }
    })
};

socket.on('game_created', (data) => {
    currentPin = data.pin;
    document.getElementById('display-pin').textContent = currentPin;
    selectionSection.classList.add('hidden');
    lobbySection.classList.remove('hidden');
});

socket.on('player_list_update', (players) => {
    const list = document.getElementById('player-list');
    document.getElementById('player-count').textContent = players.length;
    list.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.pseudo;
        list.appendChild(li);
    });
});

socket.on('all_players_answered', () => {
    clearInterval(timerInterval);
});

document.getElementById('btn-start-game').onclick = () => {
    if (!currentPin) { showToast("Erreur : Aucun code PIN !", "error"); return; }
    socket.emit('host_start_game', { pin: currentPin });
};

socket.on('game_started', (data) => {
    isLastQuestion = false;
    showQuestion(data);
});

socket.on('next_question', (data) => {
    isLastQuestion = false;
    showQuestion(data);
});

function showQuestion(data) {
    lobbySection.classList.add('hidden');
    revealSection.classList.add('hidden');
    leaderboardSection.classList.add('hidden');
    gameSection.classList.remove('hidden');

    document.getElementById('display-question').textContent = data.question;
    document.getElementById('responses-count').textContent = `Réponses : 0 / ${data.totalPlayers || 0}`;

    if (data.answers) {
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`answer-${i}-text`);
            if (el) el.textContent = data.answers[i] || '';
        }
    }

    clearInterval(timerInterval);
    let timeLeft = data.timer;
    const timerEl = document.getElementById('game-timer');
    timerEl.textContent = timeLeft;
    timerEl.style.color = 'var(--orange)';

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 5 && timeLeft > 0) {
            timerEl.style.color = 'var(--error)';
        }
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            socket.emit('host_time_up', { pin: currentPin });
        }
    }, 1000);

    document.querySelectorAll('#host-answers-grid .answer-box').forEach(el => {
        el.className = el.className.replace(/ ?reveal-correct| ?reveal-wrong/g, '');
        el.style.opacity = '1';
        el.style.filter = 'none';
    });

    document.getElementById('responses-count').classList.remove('hidden');
}

socket.on('answer_reveal', (data) => {
    gameSection.classList.add('hidden');
    revealSection.classList.remove('hidden');

    isLastQuestion = data.isLastQuestion;

    const correctIdx = parseInt(data.correctAnswerIndex);

    for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`reveal-answer-${i}`);
        if (el) el.textContent = (data.answers && data.answers[i]) || '';

        const box = el?.closest('.answer-box');
        if (box) {
            box.className = box.className.replace(/ ?reveal-correct| ?reveal-wrong/g, '');
            box.style.opacity = '';
            box.style.filter = '';
            if (i === correctIdx) {
                box.classList.add('reveal-correct');
            } else {
                box.classList.add('reveal-wrong');
            }
        }
    }

    document.getElementById('reveal-answered').textContent = data.totalAnswered;
    document.getElementById('reveal-correct').textContent = `${data.percentCorrect}%`;
    document.getElementById('reveal-wrong').textContent = data.totalWrong;

    const btn = document.getElementById('btn-see-leaderboard');
    btn.textContent = isLastQuestion ? 'Voir le classement final →' : 'Voir le classement →';
});

document.getElementById('btn-see-leaderboard').onclick = () => {
    socket.emit('host_show_leaderboard', { pin: currentPin });
};

socket.on('show_leaderboard', (data) => {
    revealSection.classList.add('hidden');
    leaderboardSection.classList.remove('hidden');

    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    const sorted = data.leaderboard.sort((a, b) => b.score - a.score);
    sorted.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        const medals = ['🥇', '🥈', '🥉'];
        li.innerHTML = `
            <span class="rank">${medals[i] || `#${i + 1}`}</span>
            <span class="pseudo">${p.pseudo}</span>
            <span class="score">${p.score} pts</span>
        `;
        list.appendChild(li);
    });

    const btn = document.getElementById('btn-next-after-lb');
    btn.textContent = isLastQuestion ? 'Voir le podium final →' : 'Question suivante →';
});

document.getElementById('btn-next-after-lb').onclick = () => {
    if (isLastQuestion) {
        socket.emit('host_show_leaderboard', { pin: currentPin, final: true });
    } else {
        socket.emit('host_next_question', { pin: currentPin });
    }
};

socket.on('quiz_ended', (data) => {
    clearInterval(timerInterval);
    leaderboardSection.classList.add('hidden');
    gameSection.classList.add('hidden');
    revealSection.classList.add('hidden');
    
    const podiumSection = document.getElementById('podium-section');

    const sorted = [...data.leaderboard].sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3);

    let podiumHtml = `
        <header><h1>🎉 Quiz Terminé !</h1></header>
        <div class="podium">
    `;

    const order = [1, 0, 2];
    const barClass = ['gold', 'silver', 'bronze'];
    const medals = ['🥇', '🥈', '🥉'];
    order.forEach((oi) => {
        if (top3[oi]) {
            podiumHtml += `
                <div class="podium-entry">
                    <div class="medal">${medals[oi]}</div>
                    <div class="pseudo">${top3[oi].pseudo}</div>
                    <div class="score">${top3[oi].score} pts</div>
                    <div class="podium-bar ${barClass[oi]}"></div>
                </div>
            `;
        }
    });

    podiumHtml += `</div>`;

    if (rest.length > 0) {
        podiumHtml += `<ul class="podium-rest">`;
        rest.forEach((p, i) => {
            podiumHtml += `<li><span>#${i + 4} ${p.pseudo}</span><span>${p.score} pts</span></li>`;
        });
        podiumHtml += `</ul>`;
    }

    podiumHtml += `
        <button class="btn-action" onclick="window.location.reload()">Retour à l'accueil</button>
    `;

    podiumSection.innerHTML = podiumHtml;
    podiumSection.classList.remove('hidden');
});

socket.on('update_response_count', (data) => {
    const el = document.getElementById('responses-count');
    if (el) el.textContent = `Réponses : ${data.answered} / ${data.total}`;
});

loadQuizzes();
