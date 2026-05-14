import {
  getAuthState,
  login,
  logout,
  register,
  subscribeAuth,
} from '../state/auth.store.js';
import { saveProfile, subscribeProfile } from '../state/profile.store.js';

const profileFields = [
  'heightCm',
  'weightKg',
  'chestCm',
  'waistCm',
  'hipsCm',
  'shoulderCm',
  'sleeveCm',
  'inseamCm',
  'footLengthCm',
  'preferredFit',
];

const viewMeta = {
  register: {
    eyebrow: 'Account',
    title: 'Create account',
    status: 'Save your measurements and get better size suggestions.',
  },
  login: {
    eyebrow: 'Welcome back',
    title: 'Log in',
    status: 'Use your email and password to open your fit profile.',
  },
  account: {
    eyebrow: 'Your account',
    title: 'Fit profile',
    status: 'Your measurements are saved to your account.',
  },
};

function formToCredentials(form) {
  const data = new FormData(form);
  return {
    email: data.get('email'),
    password: data.get('password'),
  };
}

function formToProfile(form) {
  const data = new FormData(form);
  const profile = {};

  profileFields.forEach(field => {
    const value = data.get(field);
    profile[field] = value === '' ? null : value;
  });

  return profile;
}

function fillProfileForm(form, profile) {
  if (!form) return;

  profileFields.forEach(field => {
    const input = form.elements[field];
    if (input) input.value = profile?.[field] ?? '';
  });
}

function shortEmail(email = '') {
  const [name] = email.split('@');
  if (!name) return 'Account';
  return name.length > 14 ? `${name.slice(0, 13)}...` : name;
}

function normalizeError(error) {
  const message = error?.message || '';
  const dictionary = {
    'Password must be at least 8 characters': 'Пароль должен быть минимум 8 символов.',
    'Invalid email or password': 'Неверная почта или пароль.',
    'Email is already registered': 'Этот email уже зарегистрирован. Попробуй войти.',
    'Valid email is required': 'Введи корректный email.',
  };

  return dictionary[message] || message || 'Что-то пошло не так.';
}

export function initAccountUi() {
  const modal = document.querySelector('[data-account-modal]');
  if (!modal) return;

  const openButtons = [...document.querySelectorAll('[data-account-open]')];
  const closeButtons = [...modal.querySelectorAll('[data-account-close]')];
  const views = [...modal.querySelectorAll('[data-account-view]')];
  const modeButtons = [...modal.querySelectorAll('[data-auth-mode]')];
  const title = modal.querySelector('[data-account-title]');
  const eyebrow = modal.querySelector('[data-account-eyebrow]');
  const status = modal.querySelector('[data-auth-status]');
  const accountEmail = modal.querySelector('[data-account-email]');
  const loginForm = modal.querySelector('[data-login-form]');
  const registerForm = modal.querySelector('[data-register-form]');
  const profileForm = modal.querySelector('[data-profile-form]');
  const logoutButton = modal.querySelector('[data-logout]');
  const toastStack = document.querySelector('[data-toast-stack]');

  let currentView = 'register';
  let busy = false;

  function setStatus(message, type = 'info') {
    if (!status) return;

    status.textContent = message;
    status.classList.remove(
      'account-modal__status--info',
      'account-modal__status--success',
      'account-modal__status--error',
    );
    status.classList.add(`account-modal__status--${type}`);
  }

  function showToast(message, type = 'info') {
    if (!toastStack) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toastStack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));

    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, type === 'error' ? 5000 : 3500);
  }

  function setBusy(isBusy) {
    busy = isBusy;
    modal.classList.toggle('is-busy', busy);
    modal.querySelectorAll('button, input, select, textarea').forEach(element => {
      if (element.matches('[data-account-close]')) return;
      element.disabled = busy;
    });
  }

  function setView(view) {
    currentView = view;

    views.forEach(panel => {
      panel.hidden = panel.dataset.accountView !== view;
    });

    const meta = viewMeta[view] || viewMeta.register;
    if (title) title.textContent = meta.title;
    if (eyebrow) eyebrow.textContent = meta.eyebrow;
    setStatus(meta.status, 'info');
  }

  function updateAccountTrigger(user) {
    openButtons.forEach(button => {
      if (user) {
        button.textContent = shortEmail(user.email);
        button.setAttribute('aria-label', `Account: ${user.email}`);
        button.classList.add('is-authenticated');
      } else {
        button.textContent = 'Account';
        button.setAttribute('aria-label', 'Open account panel');
        button.classList.remove('is-authenticated');
      }
    });
  }

  function renderAuthState(authState) {
    const user = authState.user;
    updateAccountTrigger(user);

    if (accountEmail) {
      accountEmail.textContent = user?.email || '';
    }

    if (authState.status === 'loading') {
      setStatus('Проверяем аккаунт...', 'info');
    }

    if (modal.hidden) return;

    if (user) {
      setView('account');
    } else if (currentView === 'account') {
      setView('register');
    }
  }

  function openModal() {
    const { user } = getAuthState();
    modal.hidden = false;
    setView(user ? 'account' : 'register');
  }

  function closeModal() {
    modal.hidden = true;
  }

  openButtons.forEach(button => button.addEventListener('click', openModal));
  closeButtons.forEach(button => button.addEventListener('click', closeModal));

  modeButtons.forEach(button => {
    button.addEventListener('click', () => {
      setView(button.dataset.authMode === 'login' ? 'login' : 'register');
    });
  });

  registerForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setBusy(true);

    try {
      await register(formToCredentials(registerForm));
      registerForm.reset();
      setView('account');
      setStatus('Аккаунт создан. Ты вошёл в профиль.', 'success');
      showToast('Аккаунт создан. Ты вошёл в профиль.', 'success');
    } catch (error) {
      const message = normalizeError(error);
      setStatus(message, 'error');
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  });

  loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setBusy(true);

    try {
      await login(formToCredentials(loginForm));
      loginForm.reset();
      setView('account');
      setStatus('Вход выполнен.', 'success');
      showToast('Вход выполнен.', 'success');
    } catch (error) {
      const message = normalizeError(error);
      setStatus(message, 'error');
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  });

  profileForm?.addEventListener('submit', async event => {
    event.preventDefault();
    setBusy(true);

    try {
      await saveProfile(formToProfile(profileForm));
      setStatus('Параметры сохранены.', 'success');
      showToast('Параметры сохранены.', 'success');
    } catch (error) {
      const message = normalizeError(error);
      setStatus(message, 'error');
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  });

  logoutButton?.addEventListener('click', async () => {
    setBusy(true);

    try {
      await logout();
      setView('register');
      setStatus('Ты вышел из аккаунта.', 'info');
      showToast('Ты вышел из аккаунта.', 'info');
    } catch (error) {
      const message = normalizeError(error);
      setStatus(message, 'error');
      showToast(message, 'error');
    } finally {
      setBusy(false);
    }
  });

  subscribeAuth(renderAuthState);
  subscribeProfile(profile => fillProfileForm(profileForm, profile));
}
