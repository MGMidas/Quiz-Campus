const btn = document.getElementById('btn-submit');
const btnText = document.getElementById('btn-text');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const toast = document.getElementById('toast');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const confirmError = document.getElementById('confirm-error');

let toastTimeout;
function showToast(msg, type) {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast ${type} visible`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(hideToast, 3000);
}

function hideToast() {
    toast.className = 'toast';
}

function clearErrors() {
    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
    confirmInput.classList.remove('input-error');
    emailError.classList.remove('visible');
    passwordError.classList.remove('visible');
    confirmError.classList.remove('visible');
}

function validate() {
    clearErrors();
    let valid = true;

    if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
        emailInput.classList.add('input-error');
        emailError.classList.add('visible');
        valid = false;
    }
    if (!passwordInput.value || passwordInput.value.length < 6) {
        passwordInput.classList.add('input-error');
        passwordError.classList.add('visible');
        valid = false;
    }
    if (passwordInput.value !== confirmInput.value) {
        confirmInput.classList.add('input-error');
        confirmError.classList.add('visible');
        valid = false;
    }
    return valid;
}

btn.addEventListener('click', () => {
    if (!validate()) return;

    hideToast();
    btn.disabled = true;
    btnText.textContent = 'Inscription...';

    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value
        })
    })
    .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
    .then(function({ ok, data }) {
        if (ok) {
            showToast('Compte créé ! Redirection...', 'success');
            setTimeout(function() { window.location.href = 'connexion.html'; }, 800);
        } else {
            showToast(data.message || 'Erreur lors de l\'inscription', 'error');
            btn.disabled = false;
            btnText.textContent = 'Créer un compte';
        }
    })
});

emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
confirmInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
