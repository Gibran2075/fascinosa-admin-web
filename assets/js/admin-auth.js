/* =============================================================
 * FASCINOSA ADMIN PORTAL — Authentication Module
 * -------------------------------------------------------------
 * Metode      : Simple auth berbasis localStorage
 * Session key : localStorage["adminSession"]
 * Remember    : localStorage["adminRememberUser"]
 * Akun demo   : admin@fascinosa.com / adminpassword123
 *
 * Fitur:
 *   - login(username, password, rememberMe)
 *   - logout()  -> hapus sesi & redirect ke index.html
 *   - Route guard: halaman dengan <body data-guard="auth">
 *   - UI halaman login (validasi, toggle password, quick login)
 * ============================================================= */
(function () {
  'use strict';

  var SESSION_KEY = 'adminSession';
  var REMEMBER_KEY = 'adminRememberUser';
  var DASHBOARD_PAGE = 'dashboard.html';
  var LOGIN_PAGE = 'index.html';

  var CREDENTIALS = {
    username: 'admin@fascinosa.com',
    password: 'adminpassword123'
  };

  /* ---------------- Storage helpers ---------------- */
  function safeGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }
  function safeRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  /* ---------------- Session ---------------- */
  function getSession() {
    var raw = safeGet(SESSION_KEY);
    if (!raw) return null;
    try {
      var session = JSON.parse(raw);
      if (session && session.username) return session;
    } catch (e) { /* corrupt data -> anggap belum login */ }
    return null;
  }

  function createSession(username) {
    return {
      username: username,
      displayName: 'Admin Toko',
      role: 'Super Admin',
      scope: 'FASCINOSA Fashion Store',
      token: 'fx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      loginAt: new Date().toISOString()
    };
  }

  function setSession(session) { safeSet(SESSION_KEY, JSON.stringify(session)); }
  function clearSession() { safeRemove(SESSION_KEY); }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  /* ---------------- Public API ---------------- */
  function login(username, password, remember) {
    var user = normalize(username);
    var pass = String(password || '');

    if (!user || !pass) {
      return { ok: false, message: 'Username/email dan password wajib diisi.' };
    }

    var validUser = (user === normalize(CREDENTIALS.username) || user === 'admin');
    var validPass = (pass === CREDENTIALS.password);

    if (!validUser || !validPass) {
      return { ok: false, message: 'Username/email atau password tidak sesuai. Silakan coba lagi.' };
    }

    var session = createSession(String(username).trim());
    setSession(session);

    if (remember) safeSet(REMEMBER_KEY, CREDENTIALS.username);
    else safeRemove(REMEMBER_KEY);

    return { ok: true, message: 'Login berhasil. Mengalihkan ke dashboard...', session: session };
  }

  function logout() {
    clearSession();
    window.location.href = LOGIN_PAGE;
  }

  function requireAuth() {
    if (!getSession()) {
      window.location.replace(LOGIN_PAGE);
      return false;
    }
    return true;
  }

  function getRememberedUser() { return safeGet(REMEMBER_KEY); }

  window.FascinosaAuth = {
    login: login,
    logout: logout,
    requireAuth: requireAuth,
    getSession: getSession,
    clearSession: clearSession,
    getRememberedUser: getRememberedUser,
    credentials: CREDENTIALS
  };

  /* =============================================================
   * UI BOOTSTRAP
   * ============================================================= */
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ---------------- Route guard (dashboard.html) ---------------- */
  function initRouteGuard() {
    var body = document.body;
    if (body && body.getAttribute('data-guard') === 'auth') {
      requireAuth();
    }
  }

  /* ---------------- Logout buttons ---------------- */
  function initLogoutButtons() {
    var buttons = document.querySelectorAll('[data-action="logout"]');
    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
      });
    });
  }

  /* ---------------- Login page ---------------- */
  function initLoginPage() {
    var form = document.getElementById('loginForm');
    if (!form) return;

    // Sudah login -> langsung ke dashboard
    if (getSession()) {
      window.location.replace(DASHBOARD_PAGE);
      return;
    }

    var userInput = document.getElementById('loginUsername');
    var passInput = document.getElementById('loginPassword');
    var rememberInput = document.getElementById('rememberMe');
    var alertBox = document.getElementById('loginAlert');
    var alertText = document.getElementById('loginAlertText');
    var submitBtn = document.getElementById('loginSubmit');
    var btnLabel = document.getElementById('loginBtnLabel');
    var btnLoading = document.getElementById('loginBtnLoading');
    var quickBtn = document.getElementById('quickLoginBtn');
    var toggleBtn = document.getElementById('togglePassword');
    var eyeShow = document.getElementById('iconEyeShow');
    var eyeHide = document.getElementById('iconEyeHide');
    var forgotLink = document.getElementById('forgotPassword');

    /* --- Prefill "Remember Me" --- */
    var remembered = getRememberedUser();
    if (remembered && userInput) {
      userInput.value = remembered;
      if (rememberInput) rememberInput.checked = true;
      if (passInput) passInput.focus();
    }

    function showAlert(type, message) {
      if (!alertBox) return;
      alertBox.setAttribute('data-type', type);
      alertBox.classList.remove('hidden');
      if (alertText) alertText.textContent = message;
    }
    function hideAlert() {
      if (!alertBox) return;
      alertBox.classList.add('hidden');
      if (userInput) userInput.classList.remove('is-error');
      if (passInput) passInput.classList.remove('is-error');
    }
    function shakeForm() {
      form.classList.remove('is-shaking');
      void form.offsetWidth; // restart animation
      form.classList.add('is-shaking');
    }
    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      if (btnLabel) btnLabel.classList.toggle('hidden', isLoading);
      if (btnLoading) btnLoading.classList.toggle('hidden', !isLoading);
    }

    /* --- Toggle password visibility --- */
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener('click', function () {
        var reveal = passInput.type === 'password';
        passInput.type = reveal ? 'text' : 'password';
        toggleBtn.setAttribute('aria-label', reveal ? 'Sembunyikan password' : 'Tampilkan password');
        if (eyeShow) eyeShow.classList.toggle('hidden', reveal);
        if (eyeHide) eyeHide.classList.toggle('hidden', !reveal);
      });
    }

    /* --- Submit --- */
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      hideAlert();

      var username = userInput ? userInput.value : '';
      var password = passInput ? passInput.value : '';
      var remember = rememberInput ? rememberInput.checked : false;

      if (!String(username).trim() || !String(password).trim()) {
        if (!String(username).trim() && userInput) userInput.classList.add('is-error');
        if (!String(password).trim() && passInput) passInput.classList.add('is-error');
        showAlert('error', 'Username/email dan password wajib diisi.');
        shakeForm();
        return;
      }

      var result = login(username, password, remember);

      if (!result.ok) {
        if (userInput) userInput.classList.add('is-error');
        if (passInput) passInput.classList.add('is-error');
        showAlert('error', result.message);
        shakeForm();
        return;
      }

      setLoading(true);
      showAlert('success', result.message);
      window.setTimeout(function () {
        window.location.href = DASHBOARD_PAGE;
      }, 550);
    });

    /* --- Quick admin login demo --- */
    if (quickBtn) {
      quickBtn.addEventListener('click', function () {
        hideAlert();
        if (userInput) userInput.value = CREDENTIALS.username;
        if (passInput) passInput.value = CREDENTIALS.password;
        if (rememberInput) rememberInput.checked = true;
        if (userInput) userInput.classList.remove('is-error');
        if (passInput) passInput.classList.remove('is-error');
        showAlert('info', 'Kredensial admin demo terisi otomatis. Menyimpan...');
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      });
    }

    /* --- Lupa password --- */
    if (forgotLink) {
      forgotLink.addEventListener('click', function (event) {
        event.preventDefault();
        showAlert('info', 'Untuk reset password, hubungi super admin toko FASCINOSA (demo: gunakan tombol Quick Admin Login).');
      });
    }

    /* --- Enter key pada input password --- */
    if (passInput) {
      passInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && typeof form.requestSubmit === 'function') {
          event.preventDefault();
          form.requestSubmit();
        }
      });
    }
  }

  /* ---------------- Init ---------------- */
  initRouteGuard();

  onReady(function () {
    initLoginPage();
    initLogoutButtons();
    refreshIcons();
  });
})();
