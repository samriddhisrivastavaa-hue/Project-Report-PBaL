// ---- state ----
let token = localStorage.getItem('sms_token') || null;
let allMessages = [];
let activeTab = 'all';

const CATS = ['personal', 'promotional', 'otp', 'transaction', 'service'];

// ---- helpers ----
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function showError(msg) {
  document.getElementById('authError').textContent = msg || '';
}

function api(path, opts = {}) {
  const headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return fetch(path, { ...opts, headers }).then(async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  });
}

// ---- quick classify (no login needed) ----
function quickClassify() {
  const text = document.getElementById('quickText').value.trim();
  const box = document.getElementById('quickResult');
  if (!text) {
    box.classList.remove('show');
    return;
  }
  api('/classify-test', { method: 'POST', body: JSON.stringify({ body: text }) })
    .then((data) => {
      box.classList.add('show');
      const phishingBadge = data.isPhishing ? ' <span class="badge phishing">⚠ Phishing</span>' : '';
      box.innerHTML =
        '<strong>Category:</strong> <span class="badge ' + data.category + '">' + data.category + '</span>' +
        phishingBadge;
    })
    .catch((e) => {
      box.classList.add('show');
      box.textContent = 'Error: ' + e.message;
    });
}

// ---- auth ----
function doLogin() {
  showError('');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  if (!email || !password) return showError('Email aur password dono zaroori hai');
  api('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    .then((data) => {
      token = data.token;
      localStorage.setItem('sms_token', token);
      enterDashboard();
    })
    .catch((e) => showError(e.message));
}

function doSignup() {
  showError('');
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  if (!email || !password) return showError('Email aur password dono zaroori hai');
  api('/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
    .then(() => doLogin())
    .catch((e) => showError(e.message));
}

// One-click demo account so the presentation never gets stuck on a login typo
function demoLogin() {
  showError('');
  const email = 'demo_' + Date.now() + '@smsorganizer.app';
  const password = 'Demo@1234';
  api('/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
    .then(() => api('/login', { method: 'POST', body: JSON.stringify({ email, password }) }))
    .then((data) => {
      token = data.token;
      localStorage.setItem('sms_token', token);
      enterDashboard();
      loadSampleMessages();
    })
    .catch((e) => showError(e.message));
}

function logout() {
  token = null;
  localStorage.removeItem('sms_token');
  document.getElementById('dashboardCard').classList.add('hidden');
  document.getElementById('authCard').classList.remove('hidden');
}

function enterDashboard() {
  document.getElementById('authCard').classList.add('hidden');
  document.getElementById('dashboardCard').classList.remove('hidden');
  fetchMessages();
}

// ---- sample data (for a clean live demo without needing a real phone) ----
const SAMPLE_MESSAGES = [
  { sender: 'HDFCBK', body: 'Your OTP is 8421. Do not share this with anyone. Valid for 10 minutes.' },
  { sender: 'ICICIB', body: 'INR 2,500 debited from A/c XX1234 on 10-Sep. Avl bal: INR 18,340.' },
  { sender: 'AmazonIN', body: 'Flash Sale! Flat 50% off on electronics. Shop now, offer valid today only.' },
  { sender: 'JioCare', body: 'Aapka recharge safal raha. Plan renewal 15-Sep ko hoga. Dhanyavaad.' },
  { sender: 'Mummy', body: 'Ghar kab aa rahe ho? Khana ban gaya hai, jaldi aa jao.' },
  { sender: 'AX-ALERT', body: 'Your account has been suspended. Click here immediately to verify: http://bit.ly/verify-acc' }
];

function loadSampleMessages() {
  Promise.all(
    SAMPLE_MESSAGES.map((m) =>
      api('/messages/create', {
        method: 'POST',
        body: JSON.stringify({ sender: m.sender, body: m.body, source: 'demo' })
      })
    )
  )
    .then(() => {
      toast('Sample messages load ho gaye');
      fetchMessages();
    })
    .catch((e) => toast('Error: ' + e.message));
}

function reclassifyAll() {
  api('/messages/reclassify', { method: 'POST' })
    .then((data) => {
      toast('Reclassified ' + data.updatedCount + ' messages');
      fetchMessages();
    })
    .catch((e) => toast('Error: ' + e.message));
}

// ---- messages list ----
function fetchMessages() {
  api('/messages')
    .then((data) => {
      allMessages = data;
      renderStats();
      renderTabs();
      renderList();
    })
    .catch((e) => toast('Error: ' + e.message));
}

function renderStats() {
  const total = allMessages.length;
  const phishing = allMessages.filter((m) => m.isPhishing).length;
  const archived = allMessages.filter((m) => m.isArchived).length;
  document.getElementById('statsRow').innerHTML = [
    ['Total', total],
    ['Phishing', phishing],
    ['Archived', archived]
  ].map(([lbl, num]) => '<div class="stat"><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>').join('');
}

function renderTabs() {
  const counts = { all: allMessages.length };
  CATS.forEach((c) => (counts[c] = allMessages.filter((m) => m.category === c).length));
  const tabs = ['all', ...CATS];
  document.getElementById('tabsRow').innerHTML = tabs
    .map(
      (t) =>
        '<div class="tab ' + (t === activeTab ? 'active' : '') + '" onclick="setTab(\'' + t + '\')">' +
        t + ' (' + counts[t] + ')' +
        '</div>'
    )
    .join('');
}

function setTab(t) {
  activeTab = t;
  renderTabs();
  renderList();
}

function renderList() {
  const list = activeTab === 'all' ? allMessages : allMessages.filter((m) => m.category === activeTab);
  const container = document.getElementById('messagesList');
  if (list.length === 0) {
    container.innerHTML = '<p class="muted">Koi message nahi hai. "Load Sample Messages" try karo.</p>';
    return;
  }
  container.innerHTML = list
    .slice()
    .reverse()
    .map((m) => {
      const phishingBadge = m.isPhishing ? ' <span class="badge phishing">⚠ Phishing</span>' : '';
      return (
        '<div class="msg"><div class="top"><span class="sender">' +
        escapeHtml(m.sender) +
        '</span><span><span class="badge ' + m.category + '">' + m.category + '</span>' + phishingBadge + '</span></div>' +
        '<div class="body">' + escapeHtml(m.body) + '</div></div>'
      );
    })
    .join('');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}

// ---- boot ----
if (token) {
  enterDashboard();
}
