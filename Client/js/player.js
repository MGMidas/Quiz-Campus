const socket = io();

const btnValider = document.getElementById('btn-valider');
const inputPin = document.getElementById('input-pin');
const inputPseudo = document.getElementById('input-pseudo');
const toast = document.getElementById('player-toast');

let toastTimeout;
function showToast(msg, type) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} visible`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

if (btnValider) {
    btnValider.addEventListener('click', () => {
        const pin = inputPin.value;
        const pseudo = inputPseudo.value;
        const playerId = sessionStorage.getItem('kahoot_playerId');
        
        if (!pin || !pseudo) return showToast("Remplis tous les champs !", "error");
        
        btnValider.disabled = true;
        btnValider.textContent = "Connexion...";
        socket.emit('player_join_game', { pin, pseudo, playerId });
    });
}

socket.on('join_success', (data) => {
    sessionStorage.setItem('kahoot_pin', data.pin);
    sessionStorage.setItem('kahoot_pseudo', data.pseudo);
    if (data.playerId) {
        sessionStorage.setItem('kahoot_playerId', data.playerId);
    }
    
    if (btnValider) { btnValider.disabled = true; btnValider.textContent = "Connecté !"; }

    if (!window.location.pathname.endsWith('joueur.html')) {
        window.location.href = 'joueur.html';
    } else {
        const nameEl = document.getElementById('player-name');
        if (nameEl) nameEl.textContent = data.pseudo;
    }
});

if (window.location.pathname.endsWith('joueur.html')) {
    const savedPin = sessionStorage.getItem('kahoot_pin');
    const savedPseudo = sessionStorage.getItem('kahoot_pseudo');
    const savedPlayerId = sessionStorage.getItem('kahoot_playerId');
    
    if (savedPin && savedPseudo) {
        socket.emit('player_join_game', { 
            pin: savedPin, 
            pseudo: savedPseudo, 
            playerId: savedPlayerId 
        });
    } else {
        window.location.href = 'accueil.html';
    }
}

socket.on('join_error', (message) => {
    if (window.location.pathname.endsWith('joueur.html')) {
        window.location.href = 'accueil.html';
    } else if (toast) {
        showToast(message, "error");
        if (btnValider) { btnValider.disabled = false; btnValider.textContent = "Valider"; }
    }
});

socket.on('game_started', (data) => {
    showQuestion(data);
});

socket.on('next_question', (data) => {
    showQuestion(data);
});

let playerTimerInterval;

function showQuestion(data) {
    const timerEl = document.getElementById('player-timer');
    const questionEl = document.getElementById('player-question');

    if (questionEl && data.question) questionEl.textContent = data.question;

    if (data.answers) {
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`pad-text-${i}`);
            if (el) el.textContent = data.answers[i] || '';
        }
    }

    clearInterval(playerTimerInterval);
    if (timerEl && data.timer) {
        let timeLeft = data.timer;
        timerEl.textContent = timeLeft;
        timerEl.style.color = 'var(--orange)';
        playerTimerInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) timerEl.textContent = timeLeft;
            if (timeLeft <= 5 && timeLeft > 0) timerEl.style.color = 'var(--error)';
            if (timeLeft <= 0) clearInterval(playerTimerInterval);
        }, 1000);
    }

    if (data && data.hasAnswered) {
        document.getElementById('screen-game').classList.add('hidden');
        document.getElementById('screen-feedback').classList.add('hidden');
        document.getElementById('screen-waiting').classList.remove('hidden');
        document.querySelector('#screen-waiting h2').textContent = "Réponse déjà envoyée !";
        document.querySelector('#screen-waiting p').textContent = "Attends la fin du chrono...";
    } else {
        document.getElementById('screen-waiting').classList.add('hidden');
        document.getElementById('screen-feedback').classList.add('hidden');
        document.getElementById('screen-game').classList.remove('hidden');
    }
}

socket.on('quiz_ended', () => {
    clearInterval(playerTimerInterval);
    document.getElementById('screen-game').classList.add('hidden');
    document.getElementById('screen-feedback').classList.add('hidden');
    document.getElementById('screen-waiting').classList.remove('hidden');
    document.getElementById('screen-waiting').innerHTML = `
        <div class="loader-content">
            <h2 style="font-size:2.5rem;">🎉 Quiz Terminé !</h2>
            <p>Regarde l'écran principal pour le podium final.</p>
        </div>
    `;
});

document.querySelectorAll('.pad-btn').forEach(button => {
    button.addEventListener('click', () => {
        const pin = sessionStorage.getItem('kahoot_pin');
        const answerIndex = button.getAttribute('data-answer');
        
        socket.emit('player_submit_answer', { pin, answerIndex });
        
        document.getElementById('screen-game').classList.add('hidden');
        document.getElementById('screen-waiting').classList.remove('hidden');
        document.querySelector('#screen-waiting h2').textContent = "Réponse envoyée !";
        document.querySelector('#screen-waiting p').textContent = "Attends la fin du chrono...";
    });
});

socket.on('answer_result', (data) => {
    document.getElementById('screen-waiting').classList.add('hidden');
    document.getElementById('screen-feedback').classList.remove('hidden');
    
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackStreak = document.getElementById('feedback-streak');
    
    if (data.isCorrect) {
        feedbackTitle.textContent = "CORRECT !";
        feedbackTitle.className = "text-success";
        feedbackStreak.textContent = `🔥 +${data.points || 100} points !`;
    } else {
        feedbackTitle.textContent = "DOMMAGE...";
        feedbackTitle.className = "text-danger";
        const msg = data.timeout ? "Temps écoulé !" : `La réponse était la n°${parseInt(data.correctAnswerIndex) + 1}`;
        feedbackStreak.textContent = msg;
    }
});

socket.on('game_terminated', (message) => {
    document.getElementById('screen-game').classList.add('hidden');
    document.getElementById('screen-feedback').classList.add('hidden');
    document.getElementById('screen-waiting').classList.remove('hidden');
    document.getElementById('screen-waiting').innerHTML = `
        <div class="loader-content">
            <h2>🚫 Partie terminée</h2>
            <p>${message || "L'animateur a quitté la partie."}</p>
            <a href="accueil.html" class="btn-player">Retour à l'accueil</a>
        </div>
    `;
    sessionStorage.removeItem('kahoot_pin');
    sessionStorage.removeItem('kahoot_pseudo');
    sessionStorage.removeItem('kahoot_playerId');
});

socket.on('update_player_score', (data) => {
    const scoreEL = document.getElementById('player-score');
    if (scoreEL) {
        scoreEL.textContent = data.score;
        console.log("Score mis à jour :", data.score, "pts");
    }
});
