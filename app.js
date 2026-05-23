const app = document.querySelector('#app');

const STORAGE_KEYS = {
  letters: 'dokugo_letters',
  received: 'dokugo_received',
  reports: 'dokugo_reports',
  receiverName: 'dokugo_receiver_name',
  users: 'dokugo_users',
  currentUsername: 'dokugo_current_username',
  currentUserId: 'dokugo_current_userId',
};

const SESSION_KEYS = {
  adminLogin: 'obi_admin_logged_in',
};

// この管理者パスワード機能はプロトタイプ用です。本番環境では、Firebase Authentication、Supabase Auth、Next.js API Routesなどを使い、サーバー側で認証・権限管理を行う必要があります。
const ADMIN_PASSWORD = 'obi-admin';

const LETTER_STATUS = {
  pending: 'pending',
  published: 'published',
  onHold: 'onHold',
  private: 'private',
  deleted: 'deleted',
};

const STATUS_LABEL = {
  [LETTER_STATUS.pending]: '未確認',
  [LETTER_STATUS.published]: '公開中',
  [LETTER_STATUS.onHold]: '保留中',
  [LETTER_STATUS.private]: '非公開',
  [LETTER_STATUS.deleted]: '削除済み',
};

const ADMIN_UI_STATE = {
  tab: LETTER_STATUS.pending,
  query: '',
  spoiler: 'all',
  genre: 'all',
  report: 'all',
  date: 'all',
};

function normalizeLetterStatus(rawStatus, rawModerationStatus) {
  const status = String(rawStatus || '').trim();
  const moderationStatus = String(rawModerationStatus || '').trim();

  // 新仕様の status はそのまま採用
  if (Object.values(LETTER_STATUS).includes(status)) {
    return status;
  }

  // 旧仕様の status 互換
  if (status === 'deliverable') return LETTER_STATUS.published;
  if (status === 'sealed') return LETTER_STATUS.private;
  if (status === 'reviewed' || status === 'open') return LETTER_STATUS.pending;

  // moderationStatus から移行
  if (moderationStatus === 'deliverable') return LETTER_STATUS.published;
  if (moderationStatus === 'sealed') return LETTER_STATUS.private;
  if (moderationStatus === 'reviewed' || moderationStatus === 'pending') return LETTER_STATUS.pending;

  return LETTER_STATUS.pending;
}

const sampleLetters = [
  {
    id: crypto.randomUUID(),
    type: 'normalLetter',
    senderName: '窓辺の読書人',
    bookTitle: '旅をする木',
    author: '星野道夫',
    letterTitle: '遠くへ行けない夜に、遠くの森を思った',
    genre: 'エッセイ',
    lengthType: 'ふつう',
    spoiler: 'なし',
    deliveryMode: 'shelfAndRandom',
    mood: '旅／静かな夜／遠くへ行きたい',
    moodTags: ['旅', '静かな夜', '遠くへ行きたい'],
    body: '拝啓、まだ名前を知らないあなたへ。\n\nこの本を読んでいるあいだ、私はずっと遠くに行きたいと思っていました。でも読み終えたあとに残ったのは、どこかへ行くことより、今いる場所の空気をもう少し深く吸ってみたいという気持ちでした。\n\nページの向こうにある森や川は、たぶん私の生活とは遠いです。それでも、朝に窓を開けることや、いつもより少しゆっくり歩くことならできる。そんな小さな自由を思い出しました。\n\nあなたがこの手紙を読む夜にも、どこか遠くの風が少しだけ届きますように。',
    createdAt: new Date().toISOString(),
    status: LETTER_STATUS.published,
    moderationStatus: 'deliverable',
    consultationStatus: 'open',
    opened: false,
  },
  {
    id: crypto.randomUUID(),
    type: 'normalLetter',
    senderName: '曇りの日のしおり',
    bookTitle: 'コンビニ人間',
    author: '村田沙耶香',
    letterTitle: '普通という言葉が、少しだけ怖くなった日',
    genre: '小説',
    lengthType: '短め',
    spoiler: 'あり',
    deliveryMode: 'shelfAndRandom',
    mood: '生活／違和感／ひとり',
    moodTags: ['生活', '違和感', 'ひとり'],
    body: '拝啓。\n\nこの本を読み終えたあと、私はしばらく台所に立っていました。冷蔵庫の音だけがしていて、急に自分の生活の形がよくわからなくなりました。\n\n普通に働くこと。普通に話すこと。普通に生きること。普段は便利に使っている言葉なのに、こんなに誰かを追い詰める言葉でもあるのだと思いました。\n\nでも同時に、自分の違和感を完全に消さなくても生きていていいのかもしれない、とも思いました。',
    createdAt: new Date().toISOString(),
    status: LETTER_STATUS.published,
    moderationStatus: 'deliverable',
    consultationStatus: 'open',
    opened: false,
  },
  {
    id: crypto.randomUUID(),
    type: 'normalLetter',
    senderName: '夜ふかしの栞',
    bookTitle: '羊をめぐる冒険',
    author: '村上春樹',
    letterTitle: '失くしたものの名前を、最後まで思い出せなかった',
    genre: '小説',
    lengthType: 'ふつう',
    spoiler: 'なし',
    deliveryMode: 'shelfAndRandom',
    mood: '余韻／喪失／曇りの日',
    moodTags: ['余韻', '喪失', '曇りの日'],
    body: '名前のない誰かへ。\n\nこの本を読み終えたあと、私は何かを失くしたような気がしました。でも、その何かの名前が最後までわかりませんでした。\n\n物語の筋を説明するより、読み終えたあとの空気のほうが強く残っています。少し乾いていて、少し遠くて、でも完全には冷たくない空気です。\n\n本には、忘れていた感情を取り出す力があるのかもしれません。あるいは、忘れていたことすら忘れていた感情を。',
    createdAt: new Date().toISOString(),
    status: LETTER_STATUS.published,
    moderationStatus: 'deliverable',
    consultationStatus: 'open',
    opened: false,
  },
];

function getData(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getReceiverName() {
  return String(localStorage.getItem(STORAGE_KEYS.receiverName) || '').trim();
}

function setReceiverName(name) {
  localStorage.setItem(STORAGE_KEYS.receiverName, String(name || '').trim());
}

// ---- ユーザー名管理 ----

function getCurrentUsername() {
  return String(localStorage.getItem(STORAGE_KEYS.currentUsername) || '').trim();
}

function getCurrentUserId() {
  return String(localStorage.getItem(STORAGE_KEYS.currentUserId) || '').trim();
}

function loadUsers() {
  return getData(STORAGE_KEYS.users, []);
}

function saveUsers(users) {
  setData(STORAGE_KEYS.users, users);
}

/**
 * ユーザー名を設定する。同名が既存なら既存ユーザーを使い、なければ新規作成する。
 * @param {string} username
 * @returns {{ id: string, username: string, createdAt: string, lastUsedAt: string }}
 */
function setCurrentUser(username) {
  const name = String(username || '').trim();
  if (!name) {
    return null;
  }

  const users = loadUsers();
  let user = users.find((u) => u.username === name);

  if (user) {
    user.lastUsedAt = new Date().toISOString();
  } else {
    user = {
      id: 'user_' + Date.now(),
      username: name,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
    };
    users.unshift(user);
  }

  saveUsers(users);
  localStorage.setItem(STORAGE_KEYS.currentUsername, name);
  localStorage.setItem(STORAGE_KEYS.currentUserId, user.id);
  return user;
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUsername);
  localStorage.removeItem(STORAGE_KEYS.currentUserId);
}

/** ユーザー名が未設定の場合にガードメッセージを表示して true を返す */
function guardUsername() {
  if (getCurrentUsername()) {
    return false;
  }

  app.innerHTML = `<section class="paper narrow center">
    <p class="eyebrow">名前が必要です</p>
    <h1>手紙を書くには、まずこのサービス内で使う名前を入力してください。</h1>
    <p class="hint">メールアドレスやパスワードは不要です。サービス内で使うお好きな名前を決めてください。</p>
    <button class="primary" data-route="home">名前を決める画面へ</button>
  </section>`;
  bindCommonRoutes();
  return true;
}

function parseMoodTags(raw = '') {
  return String(raw)
    .split(/[\/／,、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLetter(letter) {
  const type = letter.type || 'normalLetter';
  const deliveryMode = letter.deliveryMode || (type === 'replyBookLetter' ? 'direct' : (letter.delivery === 'おまかせ便のみ' ? 'randomOnly' : 'shelfAndRandom'));
  const mood = letter.mood || '';
  const migratedStatus = normalizeLetterStatus(letter.status, letter.moderationStatus);

  return {
    ...letter,
    type,
    senderName: String(letter.senderName || '名も知らぬ読者'),
    recipientName: String(letter.recipientName || ''),
    parentLetterId: String(letter.parentLetterId || ''),
    reason: String(letter.reason || ''),
    message: String(letter.message || ''),
    mood,
    moodTags: Array.isArray(letter.moodTags) ? letter.moodTags : parseMoodTags(mood),
    deliveryMode,
    status: migratedStatus,
    publishedAt: letter.publishedAt || null,
    heldAt: letter.heldAt || null,
    holdReason: String(letter.holdReason || ''),
    privateAt: letter.privateAt || null,
    deletedAt: letter.deletedAt || null,
    deleteReason: String(letter.deleteReason || ''),
    operationHistory: Array.isArray(letter.operationHistory) ? letter.operationHistory : [],
    moderationStatus: letter.moderationStatus || moderationStatusFromStatus(migratedStatus),
    consultationStatus: letter.consultationStatus || 'open',
    opened: Boolean(letter.opened),
    createdAt: letter.createdAt || new Date().toISOString(),
  };
}

function normalizeReport(report) {
  return {
    ...report,
    content: report.content || '',
    status: report.status || 'open',
    createdAt: report.createdAt || new Date().toISOString(),
  };
}

function loadLetters() {
  const letters = getData(STORAGE_KEYS.letters).map(normalizeLetter);
  setData(STORAGE_KEYS.letters, letters);
  return letters;
}

function saveLetters(letters) {
  setData(STORAGE_KEYS.letters, letters.map(normalizeLetter));
}

function loadReports() {
  const reports = getData(STORAGE_KEYS.reports).map(normalizeReport);
  setData(STORAGE_KEYS.reports, reports);
  return reports;
}

function saveReports(reports) {
  setData(STORAGE_KEYS.reports, reports.map(normalizeReport));
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(SESSION_KEYS.adminLogin) === '1';
}

function setAdminLoginState(isLoggedIn) {
  if (isLoggedIn) {
    sessionStorage.setItem(SESSION_KEYS.adminLogin, '1');
    return;
  }
  sessionStorage.removeItem(SESSION_KEYS.adminLogin);
}

function ensureSeedData() {
  const letters = getData(STORAGE_KEYS.letters);
  if (!letters.length) {
    setData(STORAGE_KEYS.letters, sampleLetters);
  }

  if (!localStorage.getItem(STORAGE_KEYS.received)) {
    setData(STORAGE_KEYS.received, []);
  }

  if (!localStorage.getItem(STORAGE_KEYS.reports)) {
    setData(STORAGE_KEYS.reports, []);
  }

  loadLetters();
  loadReports();
}

function templateForRoute(route) {
  if (route === 'admin') {
    return isAdminLoggedIn() ? 'admin-template' : 'admin-login-template';
  }

  const found = document.querySelector(`#${route}-template`);
  return found ? `${route}-template` : 'home-template';
}

function render(route = location.hash.replace('#', '') || 'home') {
  const template = document.querySelector(`#${templateForRoute(route)}`);
  app.innerHTML = template.innerHTML;
  bindCommonRoutes();

  const binders = {
    home: bindHome,
    write: bindWrite,
    receive: bindReceive,
    shelf: bindShelf,
    box: bindBox,
    news: bindNews,
    admin: bindAdminRoute,
  };

  binders[route]?.();
  bindRevealEffects();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigate(route) {
  location.hash = route;
  render(route);
}

function bindCommonRoutes() {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.addEventListener('click', () => navigate(el.dataset.route));
  });
}

function bindRevealEffects() {
  const targets = document.querySelectorAll('#app .reveal, #app .feature-card, #app .step-card, #app .safety-card, #app .choice-card, #app .floating-envelope, #app .envelope, #app .ops-card, #app .stat-card, #app .notice');
  if (!targets.length) {
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach((target) => observer.observe(target));
}

document.querySelectorAll('[data-route]').forEach((el) => {
  el.addEventListener('click', () => navigate(el.dataset.route));
});

window.addEventListener('hashchange', () => render());

function bindHome() {
  const inputArea = document.querySelector('#username-input-area');
  const activeArea = document.querySelector('#username-active-area');
  const input = document.querySelector('#username-input');
  const saveBtn = document.querySelector('#username-save-btn');
  const errorEl = document.querySelector('#username-error');
  const greeting = document.querySelector('#username-greeting');
  const changeBtn = document.querySelector('#username-change-btn');

  function showActiveState(username) {
    inputArea.hidden = true;
    activeArea.hidden = false;
    greeting.textContent = `${username}さんとして利用中`;
    bindCommonRoutes();
  }

  function showInputState() {
    inputArea.hidden = false;
    activeArea.hidden = true;
  }

  const currentUsername = getCurrentUsername();
  if (currentUsername) {
    showActiveState(currentUsername);
  } else {
    showInputState();
  }

  saveBtn.addEventListener('click', () => {
    const val = String(input.value || '').trim();
    if (!val) {
      errorEl.textContent = '名前を入力してください。';
      return;
    }
    errorEl.textContent = '';
    setCurrentUser(val);
    showActiveState(val);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });

  changeBtn.addEventListener('click', () => {
    input.value = getCurrentUsername();
    showInputState();
  });

  document.querySelectorAll('[data-scroll-to]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(`#${button.dataset.scrollTo}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelector('[data-scroll-down]')?.addEventListener('click', () => {
    const target = document.querySelector('#overview');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function bindWrite() {
  if (guardUsername()) return;

  // 差出人名に現在のユーザー名を自動入力
  const senderInput = document.querySelector('[name="senderName"]');
  if (senderInput && !senderInput.value) {
    senderInput.value = getCurrentUsername();
  }

  document.querySelector('#letter-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData(e.target);
    const letter = {
      id: crypto.randomUUID(),
      type: 'normalLetter',
      currentUserId: getCurrentUserId(),
      currentUsername: getCurrentUsername(),
      senderName: String(form.get('senderName') || '').trim() || getCurrentUsername(),
      bookTitle: String(form.get('bookTitle') || '').trim(),
      author: String(form.get('author') || '').trim(),
      letterTitle: String(form.get('letterTitle') || '').trim(),
      genre: String(form.get('genre') || '').trim(),
      lengthType: String(form.get('lengthType') || '').trim(),
      spoiler: String(form.get('spoiler') || 'なし').trim(),
      deliveryMode: String(form.get('delivery') || '').trim() === 'おまかせ便のみ' ? 'randomOnly' : 'shelfAndRandom',
      mood: String(form.get('mood') || '').trim(),
      moodTags: parseMoodTags(String(form.get('mood') || '').trim()),
      body: String(form.get('body') || '').trim(),
      createdAt: new Date().toISOString(),
      status: LETTER_STATUS.pending,
      moderationStatus: 'pending',
      consultationStatus: 'open',
      opened: false,
    };

    const letters = loadLetters();
    letters.unshift(letter);
    saveLetters(letters);

    app.innerHTML = '<section class="paper narrow center"><p class="eyebrow">Letter sent</p><h1>手紙を預かりました</h1><p>あなたの手紙は、運営室で確認されたあと、まだ名前のない誰かのもとへ向かいます。</p><div class="choice-row"><button class="primary" data-route="receive">手紙を受け取る</button><button class="secondary" data-route="shelf">封筒棚を見る</button></div></section>';
    bindCommonRoutes();
  });
}

function canReceiveRandom(letter) {
  return letter.type === 'normalLetter' && !letter.opened && letter.status === LETTER_STATUS.published;
}

function canShowOnShelf(letter) {
  return canReceiveRandom(letter) && letter.deliveryMode === 'shelfAndRandom';
}

function canReceiveDirect(letter, receiverName) {
  return letter.type === 'replyBookLetter'
    && !letter.opened
    && letter.status === LETTER_STATUS.published
    && Boolean(receiverName)
    && letter.recipientName === receiverName;
}

function bindReceive() {
  if (guardUsername()) return;

  const receiverInput = document.querySelector('#receiver-name');
  const saveButton = document.querySelector('#save-receiver-name');
  const savedName = getReceiverName();
  if (savedName) {
    receiverInput.value = savedName;
  }

  const renderDirectInbox = () => {
    const receiverName = String(receiverInput.value || '').trim();
    const directLetters = loadLetters().filter((letter) => canReceiveDirect(letter, receiverName));
    const directResult = document.querySelector('#direct-result');

    if (!receiverName) {
      directResult.innerHTML = '<div class="empty">「一冊の本を送る」で届く手紙を見るには、受け取り名を入れてください。</div>';
      return;
    }

    if (!directLetters.length) {
      directResult.innerHTML = '<div class="empty">今は、あなた宛ての一冊の本の手紙は届いていません。</div>';
      return;
    }

    directResult.innerHTML = directLetters.map((letter) => `
      <article class="ops-card">
        <p class="eyebrow">あなた宛ての一冊</p>
        <h3>${escapeHtml(letter.senderName)}さんから、一冊の本の手紙が届いています</h3>
        <p><strong>本：</strong>『${escapeHtml(letter.bookTitle)}』</p>
        <p><strong>手紙のタイトル：</strong>${escapeHtml(letter.letterTitle)}</p>
        <button class="primary" data-open-direct="${letter.id}">この手紙を読む</button>
      </article>
    `).join('');

    directResult.querySelectorAll('[data-open-direct]').forEach((btn) => {
      btn.addEventListener('click', () => openLetter(btn.dataset.openDirect, '#direct-result'));
    });
  };

  saveButton.addEventListener('click', () => {
    const receiverName = String(receiverInput.value || '').trim();
    setReceiverName(receiverName);
    renderDirectInbox();
  });

  renderDirectInbox();

  document.querySelector('#random-receive').addEventListener('click', () => {
    const letters = loadLetters();
    const available = letters.filter(canReceiveRandom);
    const result = document.querySelector('#receive-result');

    if (!available.length) {
      result.innerHTML = '<div class="empty">今は受け取れる手紙がありません。先に一通書いてみるか、しばらくしてから開いてみてください。</div>';
      return;
    }

    const letter = available[Math.floor(Math.random() * available.length)];
    openLetter(letter.id, '#receive-result');
  });
}

function bindShelf() {
  if (guardUsername()) return;

  const list = document.querySelector('#shelf-list');
  const letters = loadLetters().filter(canShowOnShelf);

  if (!letters.length) {
    list.innerHTML = '<div class="empty">今は封筒棚に並んでいる手紙がありません。</div>';
    return;
  }

  // 並び順は人気順ではなくランダム
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  list.innerHTML = shuffled.map((letter) => envelopeHtml(letter)).join('');
  list.querySelectorAll('[data-open-letter]').forEach((btn) => {
    btn.addEventListener('click', () => openLetter(btn.dataset.openLetter));
  });
}

function envelopeHtml(letter) {
  return `<article class="envelope">
    <p class="eyebrow">未開封の手紙</p>
    <h2>${escapeHtml(letter.letterTitle)}</h2>
    <p><strong>差出人：</strong>${escapeHtml(letter.senderName)}</p>
    <p><strong>本：</strong>${escapeHtml(letter.bookTitle)}</p>
    <p><strong>著者：</strong>${escapeHtml(letter.author)}</p>
    <div class="meta">
      <span class="pill">${escapeHtml(letter.genre)}</span>
      <span class="pill">ネタバレ：${escapeHtml(letter.spoiler)}</span>
      <span class="pill">${escapeHtml(letter.lengthType)}</span>
      ${letter.mood ? `<span class="pill">${escapeHtml(letter.mood)}</span>` : ''}
    </div>
    <button class="primary" data-open-letter="${letter.id}">この封筒を開く</button>
  </article>`;
}

function pushReceivedLetter(letter) {
  const received = getData(STORAGE_KEYS.received);
  if (received.some((item) => item.id === letter.id)) {
    return;
  }

  received.unshift({ ...letter, memo: '', receivedAt: new Date().toISOString() });
  setData(STORAGE_KEYS.received, received);
}

function openLetter(id, targetSelector = null) {
  const letters = loadLetters();
  const index = letters.findIndex((l) => l.id === id);

  if (index < 0) {
    return;
  }

  letters[index].opened = true;
  letters[index].openedAt = new Date().toISOString();
  saveLetters(letters);
  pushReceivedLetter(letters[index]);

  const html = letterHtml(letters[index], true);
  if (targetSelector) {
    document.querySelector(targetSelector).innerHTML = html;
  } else {
    app.innerHTML = `<section class="paper narrow"><p class="eyebrow">Opened letter</p><h1>手紙が届きました</h1>${html}<button class="secondary" data-route="shelf">封筒棚に戻る</button></section>`;
    bindCommonRoutes();
  }

  bindLetterActions();
}

function hasReplyBeenSent(parentLetterId) {
  return loadLetters().some((letter) => letter.type === 'replyBookLetter' && letter.parentLetterId === parentLetterId);
}

function replyBookLetterHtml(letter, justOpened = false) {
  return `<article class="letter" data-letter-id="${letter.id}">
    ${justOpened ? '<p class="eyebrow">あなた宛ての一冊</p>' : ''}
    <h2 class="letter-title">${escapeHtml(letter.senderName)}さんから、一冊の本の手紙が届きました。</h2>
    <p><strong>本：</strong>『${escapeHtml(letter.bookTitle)}』</p>
    <p><strong>著者：</strong>${escapeHtml(letter.author)}</p>
    <p><strong>手紙のタイトル：</strong>${escapeHtml(letter.letterTitle)}</p>
    <div class="meta">
      <span class="pill">宛先：${escapeHtml(letter.recipientName || '指定なし')}</span>
      <span class="pill">ネタバレ：${letter.spoiler ? 'あり' : 'なし'}</span>
      ${letter.moodTags?.length ? `<span class="pill">${escapeHtml(letter.moodTags.join('／'))}</span>` : ''}
    </div>
    <p><strong>この本を選んだ理由：</strong></p>
    <div class="letter-body">${escapeHtml(letter.reason)}</div>
    <p><strong>感想：</strong></p>
    <div class="letter-body">${escapeHtml(letter.body)}</div>
    <p><strong>あなたへ：</strong></p>
    <div class="letter-body">${escapeHtml(letter.message)}</div>
    <div class="actions">
      <button class="small-btn" data-report="${letter.id}">この手紙について運営に相談する</button>
      <button class="small-btn" data-save-memo="${letter.id}">読後メモを保存</button>
    </div>
    <textarea class="memo-input" placeholder="この手紙を読んで残った気持ちを、自分だけにメモできます。">${escapeHtml(letter.memo || '')}</textarea>
  </article>`;
}

function normalLetterHtml(letter, justOpened = false) {
  const alreadySent = hasReplyBeenSent(letter.id);
  const replyBlock = alreadySent
    ? '<p class="hint sent-note">この人へ一冊送りました</p>'
    : `<button class="small-btn" data-open-reply="${letter.id}">思い浮かんだ一冊を送る</button>`;

  return `<article class="letter" data-letter-id="${letter.id}">
    ${justOpened ? '<p class="eyebrow">あなた宛ての一通</p>' : ''}
    <h2 class="letter-title">${escapeHtml(letter.letterTitle)}</h2>
    <p><strong>差出人：</strong>${escapeHtml(letter.senderName)}</p>
    <p><strong>本：</strong>${escapeHtml(letter.bookTitle)} ／ <strong>著者：</strong>${escapeHtml(letter.author)}</p>
    <div class="meta">
      <span class="pill">${escapeHtml(letter.genre)}</span>
      <span class="pill">ネタバレ：${escapeHtml(letter.spoiler)}</span>
      <span class="pill">${escapeHtml(letter.lengthType)}</span>
      ${letter.mood ? `<span class="pill">${escapeHtml(letter.mood)}</span>` : ''}
    </div>
    <div class="letter-body">${escapeHtml(letter.body)}</div>
    <div class="actions">
      ${replyBlock}
      <button class="small-btn" data-report="${letter.id}">この手紙について運営に相談する</button>
      <button class="small-btn" data-save-memo="${letter.id}">読後メモを保存</button>
    </div>
    <div class="reply-compose" id="reply-compose-${letter.id}" hidden>
      ${replyFormHtml(letter)}
    </div>
    <textarea class="memo-input" placeholder="この手紙を読んで残った気持ちを、自分だけにメモできます。">${escapeHtml(letter.memo || '')}</textarea>
  </article>`;
}

function letterHtml(letter, justOpened = false) {
  if (letter.type === 'replyBookLetter') {
    return replyBookLetterHtml(letter, justOpened);
  }
  return normalLetterHtml(letter, justOpened);
}

function replyFormHtml(parentLetter) {
  const currentUsername = getCurrentUsername();
  return `<section class="assist-box">
    <p class="eyebrow">Book letter</p>
    <h3>一冊の本を、手紙として送る</h3>
    <p class="hint">これは会話を続けるための機能ではありません。届いた手紙を読んで思い浮かんだ一冊があるときだけ、その本を一通の手紙として送ることができます。送らなくても大丈夫です。</p>
    <form class="form" data-reply-form="${parentLetter.id}">
      <label>差出人の名前<input name="senderName" required placeholder="例：灯子" value="${escapeHtml(currentUsername)}" /></label>
      <label>相手の名前<input name="recipientName" required value="${escapeHtml(parentLetter.senderName)}" /></label>
      <label>おすすめしたい本のタイトル<input name="bookTitle" required placeholder="例：夜と霧" /></label>
      <label>著者名<input name="author" required placeholder="例：ヴィクトール・E・フランクル" /></label>
      <label>手紙のタイトル<input name="letterTitle" required placeholder="例：静かな灯りを渡したくて" /></label>
      <label>この本を選んだ理由<textarea name="reason" rows="4" required placeholder="どうしてこの一冊を選んだか"></textarea></label>
      <label>本の感想<textarea name="body" rows="6" required placeholder="あなたの感想"></textarea></label>
      <label>相手に届けたい一言<textarea name="message" rows="3" required placeholder="最後に届けたい言葉"></textarea></label>
      <div class="split">
        <label>ネタバレ<select name="spoiler"><option value="false">なし</option><option value="true">あり</option></select></label>
        <label>気分タグ<input name="moodTags" placeholder="例：静かな夜／余韻" /></label>
      </div>
      <button class="primary" type="submit">一冊の本を送る</button>
    </form>
  </section>`;
}

function bindNews() {
  // news-templateはHTMLに静的コンテンツとして記述
}

function bindBox() {
  if (guardUsername()) return;

  const list = document.querySelector('#box-list');
  const received = getData(STORAGE_KEYS.received);
  const receiverHint = document.querySelector('#box-receiver-name');
  const receiverName = getReceiverName();

  receiverHint.textContent = receiverName
    ? `受け取り名：${receiverName}`
    : '受け取り名は、受け取るページで設定できます。';

  if (!received.length) {
    list.innerHTML = '<div class="empty">まだ受け取った手紙はありません。</div>';
    return;
  }

  list.innerHTML = received.map((letter) => letterHtml(normalizeLetter(letter))).join('');
  bindLetterActions();
}

function bindLetterActions() {
  document.querySelectorAll('[data-open-reply]').forEach((btn) => {
    btn.onclick = () => {
      const target = document.querySelector(`#reply-compose-${btn.dataset.openReply}`);
      if (!target) {
        return;
      }
      target.hidden = !target.hidden;
    };
  });

  document.querySelectorAll('[data-reply-form]').forEach((formEl) => {
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();

      const parentLetterId = formEl.dataset.replyForm;
      const form = new FormData(formEl);
      const moodTags = parseMoodTags(String(form.get('moodTags') || '').trim());
      const replyLetter = {
        id: crypto.randomUUID(),
        type: 'replyBookLetter',
        parentLetterId,
        currentUserId: getCurrentUserId(),
        currentUsername: getCurrentUsername(),
        senderName: String(form.get('senderName') || '').trim(),
        recipientName: String(form.get('recipientName') || '').trim(),
        bookTitle: String(form.get('bookTitle') || '').trim(),
        author: String(form.get('author') || '').trim(),
        letterTitle: String(form.get('letterTitle') || '').trim(),
        reason: String(form.get('reason') || '').trim(),
        body: String(form.get('body') || '').trim(),
        message: String(form.get('message') || '').trim(),
        spoiler: String(form.get('spoiler') || 'false') === 'true',
        moodTags,
        createdAt: new Date().toISOString(),
        status: LETTER_STATUS.pending,
        moderationStatus: 'pending',
        consultationStatus: 'open',
        deliveryMode: 'direct',
        opened: false,
      };

      const letters = loadLetters();
      letters.unshift(replyLetter);
      saveLetters(letters);

      alert('あなたの一冊を、手紙として送りました');
      render('box');
    });
  });

  document.querySelectorAll('[data-report]').forEach((btn) => {
    btn.onclick = () => {
      alert('相談内容は運営だけが確認します。\n相手にあなたの名前や相談内容が伝わることはありません。\n内容を確認し、必要に応じて手紙を非公開にします。');
      const reason = prompt('相談理由を短く書いてください。');
      if (!reason) {
        return;
      }

      const content = prompt('相談内容を具体的に書いてください。');
      if (!content) {
        return;
      }

      const reports = loadReports();
      reports.unshift({
        id: crypto.randomUUID(),
        letterId: btn.dataset.report,
        currentUserId: getCurrentUserId(),
        currentUsername: getCurrentUsername(),
        reason,
        content,
        status: 'open',
        createdAt: new Date().toISOString(),
      });
      saveReports(reports);
      alert('相談内容を受け付けました。');
    };
  });

  document.querySelectorAll('[data-save-memo]').forEach((btn) => {
    btn.onclick = () => {
      const article = btn.closest('.letter');
      const memo = article.querySelector('.memo-input').value;
      const received = getData(STORAGE_KEYS.received).map((l) => (
        l.id === btn.dataset.saveMemo
          ? { ...l, memo, memoUserId: getCurrentUserId(), memoUsername: getCurrentUsername() }
          : l
      ));
      setData(STORAGE_KEYS.received, received);
      alert('読後メモを保存しました。');
    };
  });
}

function bindAdminRoute() {
  if (isAdminLoggedIn()) {
    bindAdmin();
    return;
  }

  bindAdminLogin();
}

function bindAdminLogin() {
  const form = document.querySelector('#admin-login-form');
  const errorEl = document.querySelector('#admin-login-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const password = String(formData.get('password') || '');

    if (password !== ADMIN_PASSWORD) {
      errorEl.textContent = 'パスワードが違います';
      return;
    }

    setAdminLoginState(true);
    render('admin');
  });
}

function bindAdmin() {
  bindAdminTabsAndFilters();
  renderAdminView();

  document.querySelector('#admin-logout').addEventListener('click', () => {
    setAdminLoginState(false);
    render('admin');
  });

  document.querySelector('#reset-demo').addEventListener('click', () => {
    if (!confirm('ローカル保存されたデモデータを初期化しますか？')) {
      return;
    }

    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    ensureSeedData();
    render('admin');
  });

  const adminRoot = document.querySelector('.admin-page');
  adminRoot?.addEventListener('click', (e) => {
    const target = e.target.closest('[data-admin-action], [data-admin-tab], [data-close-admin-modal], [data-open-letter-from-report], [data-admin-summary-tab]');
    if (!target) {
      return;
    }

    if (target.dataset.adminTab) {
      ADMIN_UI_STATE.tab = target.dataset.adminTab;
      renderAdminView();
      return;
    }

    if (target.dataset.adminSummaryTab) {
      ADMIN_UI_STATE.tab = target.dataset.adminSummaryTab;
      renderAdminView();
      return;
    }

    if (target.dataset.closeAdminModal !== undefined) {
      closeAdminModal();
      return;
    }

    if (target.dataset.openLetterFromReport) {
      openAdminLetterModal(target.dataset.openLetterFromReport);
      return;
    }

    const action = target.dataset.adminAction;
    const letterId = target.dataset.letterId;
    const reportId = target.dataset.reportId;
    handleAdminAction(action, letterId, reportId);
  });
}

function bindAdminTabsAndFilters() {
  const search = document.querySelector('#admin-letter-search');
  const spoiler = document.querySelector('#admin-filter-spoiler');
  const genre = document.querySelector('#admin-filter-genre');
  const report = document.querySelector('#admin-filter-report');
  const date = document.querySelector('#admin-filter-date');
  const userSearch = document.querySelector('#admin-user-search');

  search.value = ADMIN_UI_STATE.query;
  spoiler.value = ADMIN_UI_STATE.spoiler;
  report.value = ADMIN_UI_STATE.report;
  date.value = ADMIN_UI_STATE.date;

  search.oninput = () => {
    ADMIN_UI_STATE.query = search.value;
    renderAdminView();
  };

  spoiler.onchange = () => {
    ADMIN_UI_STATE.spoiler = spoiler.value;
    renderAdminView();
  };

  genre.onchange = () => {
    ADMIN_UI_STATE.genre = genre.value;
    renderAdminView();
  };

  report.onchange = () => {
    ADMIN_UI_STATE.report = report.value;
    renderAdminView();
  };

  date.onchange = () => {
    ADMIN_UI_STATE.date = date.value;
    renderAdminView();
  };

  userSearch.oninput = () => {
    renderAdminUsers(userSearch.value);
  };

  const genres = [...new Set(loadLetters().map((l) => l.genre).filter(Boolean))];
  const options = ['<option value="all">ジャンル: すべて</option>']
    .concat(genres.map((g) => `<option value="${escapeHtml(g)}">ジャンル: ${escapeHtml(g)}</option>`));
  genre.innerHTML = options.join('');
  genre.value = ADMIN_UI_STATE.genre;
}

function renderAdminView() {
  renderAdminStats();
  renderAdminTabs();
  renderAdminLetters();
  renderAdminReports();
  renderAdminUsers(document.querySelector('#admin-user-search')?.value || '');
}

function renderAdminTabs() {
  const tab = ADMIN_UI_STATE.tab;
  document.querySelectorAll('.admin-tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.adminTab === tab);
  });

  const lettersPanel = document.querySelector('[data-admin-panel="letters"]');
  const reportsPanel = document.querySelector('[data-admin-panel="reports"]');
  const usersPanel = document.querySelector('[data-admin-panel="users"]');
  const settingsPanel = document.querySelector('[data-admin-panel="settings"]');
  const heading = document.querySelector('#admin-letters-heading');

  const isLetterTab = Object.values(LETTER_STATUS).includes(tab);
  lettersPanel.hidden = !isLetterTab;
  reportsPanel.hidden = tab !== 'reports';
  usersPanel.hidden = tab !== 'users';
  settingsPanel.hidden = tab !== 'settings';
  if (heading && isLetterTab) {
    heading.textContent = `${STATUS_LABEL[tab]}の手紙`;
  }
}

function renderAdminStats() {
  const stats = document.querySelector('#admin-stats');
  const letters = loadLetters();
  const reports = loadReports();
  const openReportLetterIds = new Set(reports.filter((r) => r.status !== 'resolved').map((r) => r.letterId));

  stats.innerHTML = `
    <article class="stat-card" data-admin-summary-tab="pending"><h2>${letters.filter((l) => l.status === LETTER_STATUS.pending).length}</h2><p>未確認の手紙</p></article>
    <article class="stat-card" data-admin-summary-tab="published"><h2>${letters.filter((l) => l.status === LETTER_STATUS.published).length}</h2><p>公開中の手紙</p></article>
    <article class="stat-card" data-admin-summary-tab="onHold"><h2>${letters.filter((l) => l.status === LETTER_STATUS.onHold).length}</h2><p>保留中の手紙</p></article>
    <article class="stat-card" data-admin-summary-tab="private"><h2>${letters.filter((l) => l.status === LETTER_STATUS.private).length}</h2><p>非公開の手紙</p></article>
    <article class="stat-card" data-admin-summary-tab="deleted"><h2>${letters.filter((l) => l.status === LETTER_STATUS.deleted).length}</h2><p>削除済みの手紙</p></article>
    <article class="stat-card" data-admin-summary-tab="reports"><h2>${openReportLetterIds.size}</h2><p>相談ありの手紙</p></article>
  `;
}

function renderAdminLetters() {
  const el = document.querySelector('#admin-letters');
  if (!el) return;

  const letters = getFilteredLettersByAdminState();
  const reports = loadReports();
  const reportByLetter = new Map();
  reports.forEach((report) => {
    if (!reportByLetter.has(report.letterId)) {
      reportByLetter.set(report.letterId, []);
    }
    reportByLetter.get(report.letterId).push(report);
  });

  if (!letters.length) {
    el.innerHTML = '<div class="empty">条件に一致する手紙はありません。</div>';
    return;
  }

  el.innerHTML = letters.map((letter) => adminLetterCard(letter, reportByLetter.get(letter.id) || [])).join('');
}

function adminLetterCard(letter, reports = []) {
  const summary = trimText(letter.body, 120);
  const typeLabel = letter.type === 'replyBookLetter' ? '一冊の本の手紙' : '通常の手紙';
  const hasReports = reports.length > 0;
  const openReports = reports.filter((r) => r.status !== 'resolved').length;
  const status = letter.status || LETTER_STATUS.pending;

  return `<article class="ops-card admin-letter-card admin-status-${status}">
    <div class="admin-letter-head">
      <p class="eyebrow">${typeLabel}</p>
      <div class="admin-badges">
        <span class="pill admin-status-pill admin-status-${status}">${STATUS_LABEL[status]}</span>
        ${hasReports ? `<span class="pill admin-report-pill">相談あり${openReports ? ` (${openReports})` : ''}</span>` : ''}
      </div>
    </div>
    <h3>${escapeHtml(letter.letterTitle || 'タイトルなし')}</h3>
    <p><strong>差出人名：</strong>${escapeHtml(letter.senderName)}</p>
    <p><strong>利用者：</strong>${letter.currentUsername ? `${escapeHtml(letter.currentUsername)} / ${escapeHtml(letter.currentUserId)}` : '（記録なし）'}</p>
    <p><strong>宛先名：</strong>${escapeHtml(letter.recipientName || '指定なし')}</p>
    <p><strong>本のタイトル：</strong>${escapeHtml(letter.bookTitle)} ／ <strong>著者名：</strong>${escapeHtml(letter.author)}</p>
    ${letter.parentLetterId ? `<p><strong>元になった手紙ID：</strong>${escapeHtml(letter.parentLetterId)}</p>` : ''}
    <p class="hint">${escapeHtml(summary)}</p>
    <div class="meta">
      ${letter.type === 'normalLetter' ? `<span class="pill">ジャンル：${escapeHtml(letter.genre || '未設定')}</span>` : ''}
      <span class="pill">ネタバレ：${letter.type === 'replyBookLetter' ? (letter.spoiler ? 'あり' : 'なし') : escapeHtml(letter.spoiler || 'なし')}</span>
      ${letter.mood ? `<span class="pill">気分：${escapeHtml(letter.mood)}</span>` : ''}
      <span class="pill">投稿：${formatDate(letter.createdAt)}</span>
      ${letter.publishedAt ? `<span class="pill">公開：${formatDate(letter.publishedAt)}</span>` : ''}
      ${letter.heldAt ? `<span class="pill">保留：${formatDate(letter.heldAt)}</span>` : ''}
      ${letter.privateAt ? `<span class="pill">非公開：${formatDate(letter.privateAt)}</span>` : ''}
      ${letter.deletedAt ? `<span class="pill">削除：${formatDate(letter.deletedAt)}</span>` : ''}
    </div>
    ${letter.holdReason ? `<p class="hint"><strong>保留理由：</strong>${escapeHtml(letter.holdReason)}</p>` : ''}
    ${letter.deleteReason ? `<p class="hint"><strong>削除理由：</strong>${escapeHtml(letter.deleteReason)}</p>` : ''}
    <div class="actions">
      <button class="small-btn" data-admin-action="view" data-letter-id="${letter.id}">全文を見る</button>
      ${status !== LETTER_STATUS.published && status !== LETTER_STATUS.deleted ? `<button class="small-btn admin-action-publish" data-admin-action="publish" data-letter-id="${letter.id}">公開する</button>` : ''}
      ${status === LETTER_STATUS.published ? `<button class="small-btn admin-action-private" data-admin-action="private" data-letter-id="${letter.id}">非公開にする</button>` : ''}
      ${(status === LETTER_STATUS.pending || status === LETTER_STATUS.published) ? `<button class="small-btn admin-action-hold" data-admin-action="hold" data-letter-id="${letter.id}">保留する</button>` : ''}
      ${(status === LETTER_STATUS.onHold || status === LETTER_STATUS.private) ? `<button class="small-btn admin-action-publish" data-admin-action="publish" data-letter-id="${letter.id}">公開する</button>` : ''}
      ${status === LETTER_STATUS.deleted ? `<button class="small-btn admin-action-restore" data-admin-action="restore" data-letter-id="${letter.id}">復元する</button>` : ''}
      ${status === LETTER_STATUS.deleted
        ? `<button class="small-btn admin-action-hard-delete" data-admin-action="hard-delete" data-letter-id="${letter.id}">完全に削除する</button>`
        : `<button class="small-btn admin-action-delete" data-admin-action="delete" data-letter-id="${letter.id}">削除する</button>`}
    </div>
  </article>`;
}

function renderAdminReports() {
  const el = document.querySelector('#admin-reports');
  if (!el) return;

  const reports = loadReports();
  const letters = loadLetters();

  if (!reports.length) {
    el.innerHTML = '<div class="empty">相談はまだ届いていません。</div>';
    return;
  }

  el.innerHTML = reports.map((report) => {
    const linkedLetter = letters.find((letter) => letter.id === report.letterId);
    return `<article class="ops-card">
      <p class="eyebrow">${report.status === 'resolved' ? '対応済み' : '未対応'}</p>
      <h3>相談された手紙：${escapeHtml(linkedLetter?.letterTitle || '手紙情報なし')}</h3>
      <p><strong>相談した利用者：</strong>${report.currentUsername ? `${escapeHtml(report.currentUsername)} / ${escapeHtml(report.currentUserId)}` : '（記録なし）'}</p>
      <p><strong>種別：</strong>${escapeHtml(linkedLetter?.type === 'replyBookLetter' ? '一冊の本の手紙' : '通常の手紙')}</p>
      <p><strong>現在ステータス：</strong>${linkedLetter ? STATUS_LABEL[linkedLetter.status] : '不明'}</p>
      <p><strong>差出人名：</strong>${escapeHtml(linkedLetter?.senderName || '不明')}</p>
      <p><strong>宛先名：</strong>${escapeHtml(linkedLetter?.recipientName || '指定なし')}</p>
      <p><strong>相談理由：</strong>${escapeHtml(report.reason)}</p>
      <p><strong>相談本文：</strong>${escapeHtml(report.content || '記載なし')}</p>
      <p class="hint">相談日時：${formatDate(report.createdAt)}</p>
      <div class="actions">
        ${linkedLetter ? `<button class="small-btn" data-open-letter-from-report="${linkedLetter.id}">対象の手紙を開く</button>` : ''}
        <button class="small-btn" data-admin-action="resolve-report" data-report-id="${report.id}">対応済みにする</button>
        ${linkedLetter ? `<button class="small-btn admin-action-hold" data-admin-action="report-hold" data-letter-id="${linkedLetter.id}" data-report-id="${report.id}">対象を保留にする</button>` : ''}
        ${linkedLetter ? `<button class="small-btn admin-action-private" data-admin-action="report-private" data-letter-id="${linkedLetter.id}" data-report-id="${report.id}">対象を非公開にする</button>` : ''}
        ${linkedLetter ? `<button class="small-btn admin-action-delete" data-admin-action="report-delete" data-letter-id="${linkedLetter.id}" data-report-id="${report.id}">対象を削除する</button>` : ''}
      </div>
    </article>`;
  }).join('');
}

function renderAdminUsers(filterQuery = '') {
  const el = document.querySelector('#admin-users');
  if (!el) return;

  const users = loadUsers();
  const letters = loadLetters();
  const reports = loadReports();
  const received = getData(STORAGE_KEYS.received, []);

  const query = filterQuery.trim().toLowerCase();
  const filtered = query
    ? users.filter((u) => u.username.toLowerCase().includes(query))
    : users;

  if (!filtered.length) {
    el.innerHTML = '<div class="empty">利用者はまだいません。</div>';
    return;
  }

  el.innerHTML = filtered.map((user) => {
    const userLetters = letters.filter((l) => l.currentUserId === user.id);
    const normalLetters = userLetters.filter((l) => l.type === 'normalLetter').length;
    const replyLetters = userLetters.filter((l) => l.type === 'replyBookLetter').length;
    const userMemos = received.filter((l) => l.memoUserId === user.id && l.memo).length;
    const userReports = reports.filter((r) => r.currentUserId === user.id).length;
    const userReceived = received.filter((l) => l.currentUserId === user.id || userLetters.some((ul) => ul.recipientName === user.username)).length;

    return `<article class="ops-card user-card">
      <p class="eyebrow">利用者</p>
      <h3>${escapeHtml(user.username)}</h3>
      <p class="hint">${escapeHtml(user.id)}</p>
      <div class="meta">
        <span class="pill">初回：${formatDate(user.createdAt)}</span>
        <span class="pill">最終：${formatDate(user.lastUsedAt)}</span>
      </div>
      <div class="user-stats">
        <span>投稿した手紙：<strong>${normalLetters}</strong></span>
        <span>送った本の手紙：<strong>${replyLetters}</strong></span>
        <span>読後メモ：<strong>${userMemos}</strong></span>
        <span>相談／通報：<strong>${userReports}</strong></span>
      </div>
    </article>`;
  }).join('');
}

function getFilteredLettersByAdminState() {
  const letters = loadLetters();
  const reports = loadReports();
  const reportLetterIds = new Set(reports.map((r) => r.letterId));
  const query = ADMIN_UI_STATE.query.trim().toLowerCase();

  return letters
    .filter((letter) => letter.status === ADMIN_UI_STATE.tab)
    .filter((letter) => {
      if (!query) return true;
      const text = [
        letter.letterTitle,
        letter.bookTitle,
        letter.author,
        letter.senderName,
        letter.currentUsername,
        letter.body,
      ].join(' ').toLowerCase();
      return text.includes(query);
    })
    .filter((letter) => {
      if (ADMIN_UI_STATE.spoiler === 'all') return true;
      const spoiler = letter.type === 'replyBookLetter' ? (letter.spoiler ? 'あり' : 'なし') : String(letter.spoiler || 'なし');
      return spoiler === ADMIN_UI_STATE.spoiler;
    })
    .filter((letter) => ADMIN_UI_STATE.genre === 'all' || String(letter.genre || '') === ADMIN_UI_STATE.genre)
    .filter((letter) => {
      if (ADMIN_UI_STATE.report === 'all') return true;
      const hasReport = reportLetterIds.has(letter.id);
      return ADMIN_UI_STATE.report === 'yes' ? hasReport : !hasReport;
    })
    .filter((letter) => {
      if (ADMIN_UI_STATE.date === 'all') return true;
      const created = new Date(letter.createdAt).getTime();
      const now = Date.now();
      if (ADMIN_UI_STATE.date === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        return created >= start.getTime();
      }
      if (ADMIN_UI_STATE.date === '7d') return created >= now - (7 * 24 * 60 * 60 * 1000);
      if (ADMIN_UI_STATE.date === '30d') return created >= now - (30 * 24 * 60 * 60 * 1000);
      return true;
    });
}

function moderationStatusFromStatus(status) {
  if (status === LETTER_STATUS.published) return 'deliverable';
  if (status === LETTER_STATUS.private || status === LETTER_STATUS.deleted) return 'sealed';
  return 'pending';
}

function appendOperationHistory(letter, action, label) {
  const history = Array.isArray(letter.operationHistory) ? [...letter.operationHistory] : [];
  history.unshift({ action, label, at: new Date().toISOString() });
  return history;
}

function updateLetterStatus(letter, nextStatus, extra = {}) {
  const patch = {
    status: nextStatus,
    moderationStatus: moderationStatusFromStatus(nextStatus),
    operationHistory: appendOperationHistory(letter, nextStatus, STATUS_LABEL[nextStatus] || nextStatus),
    ...extra,
  };

  if (nextStatus === LETTER_STATUS.published) patch.publishedAt = new Date().toISOString();
  if (nextStatus === LETTER_STATUS.onHold) patch.heldAt = new Date().toISOString();
  if (nextStatus === LETTER_STATUS.private) patch.privateAt = new Date().toISOString();
  if (nextStatus === LETTER_STATUS.deleted) patch.deletedAt = new Date().toISOString();

  return { ...letter, ...patch };
}

function handleAdminAction(action, letterId, reportId) {
  if (action === 'view') {
    openAdminLetterModal(letterId);
    return;
  }

  if (action === 'resolve-report') {
    const updated = loadReports().map((r) => (r.id === reportId ? { ...r, status: 'resolved', resolvedAt: new Date().toISOString() } : r));
    saveReports(updated);
    showAdminToast('相談対応を更新しました。');
    renderAdminView();
    return;
  }

  if (!letterId) {
    return;
  }

  const letters = loadLetters();
  const index = letters.findIndex((l) => l.id === letterId);
  if (index < 0) return;
  const target = letters[index];

  const commit = (updatedLetter, toastMessage, moveTab = true) => {
    letters[index] = updatedLetter;
    saveLetters(letters);
    if (moveTab && Object.values(LETTER_STATUS).includes(updatedLetter.status)) {
      ADMIN_UI_STATE.tab = updatedLetter.status;
    }
    if (reportId) {
      const updatedReports = loadReports().map((r) => (r.id === reportId ? { ...r, status: 'resolved', resolvedAt: new Date().toISOString() } : r));
      saveReports(updatedReports);
    }
    closeAdminModal();
    showAdminToast(toastMessage);
    renderAdminView();
  };

  if (action === 'publish') {
    commit(updateLetterStatus(target, LETTER_STATUS.published, { holdReason: '' }), '手紙を公開しました。');
    return;
  }

  if (action === 'hold' || action === 'report-hold') {
    const reason = prompt('保留理由（任意）を入力してください。', target.holdReason || '');
    if (reason === null) return;
    commit(updateLetterStatus(target, LETTER_STATUS.onHold, { holdReason: String(reason || '').trim() }), '手紙を保留にしました。');
    return;
  }

  if (action === 'private' || action === 'report-private') {
    if (!confirm('この手紙を非公開にしますか？\n一般画面には表示されなくなります。')) return;
    commit(updateLetterStatus(target, LETTER_STATUS.private), '手紙を非公開にしました。');
    return;
  }

  if (action === 'delete' || action === 'report-delete') {
    const ok = confirm('この手紙を削除しますか？\n削除すると、一般画面には表示されなくなります。\nこの操作はあとから取り消せない可能性があります。');
    if (!ok) return;
    const reason = prompt('削除理由（任意）を入力してください。', target.deleteReason || '');
    if (reason === null) return;
    commit(updateLetterStatus(target, LETTER_STATUS.deleted, { deleteReason: String(reason || '').trim() }), '手紙を削除しました。');
    return;
  }

  if (action === 'restore') {
    if (!confirm('削除済みの手紙を復元しますか？')) return;
    const restored = updateLetterStatus(target, LETTER_STATUS.pending, { deletedAt: null });
    commit(restored, '手紙を復元しました。');
    return;
  }

  if (action === 'hard-delete') {
    const ok = confirm('この手紙を完全に削除します。\nこの操作は元に戻せません。\n本当に削除しますか？');
    if (!ok) return;
    const remained = letters.filter((l) => l.id !== letterId);
    saveLetters(remained);
    setData(STORAGE_KEYS.received, getData(STORAGE_KEYS.received, []).filter((l) => l.id !== letterId));
    saveReports(loadReports().filter((r) => r.letterId !== letterId));
    closeAdminModal();
    showAdminToast('手紙を完全に削除しました。');
    renderAdminView();
  }
}

function openAdminLetterModal(letterId) {
  const modal = document.querySelector('#admin-letter-modal');
  const body = document.querySelector('#admin-letter-modal-body');
  const letter = loadLetters().find((l) => l.id === letterId);
  if (!modal || !body || !letter) return;

  const reports = loadReports().filter((r) => r.letterId === letter.id);
  body.innerHTML = `<article class="ops-card admin-modal-content">
    <p class="eyebrow">${STATUS_LABEL[letter.status] || '未確認'}</p>
    <h2>${escapeHtml(letter.letterTitle || 'タイトルなし')}</h2>
    <p><strong>本のタイトル：</strong>${escapeHtml(letter.bookTitle)}</p>
    <p><strong>著者名：</strong>${escapeHtml(letter.author)}</p>
    <p><strong>差出人名：</strong>${escapeHtml(letter.senderName)}</p>
    <p><strong>ユーザー：</strong>${letter.currentUsername ? `${escapeHtml(letter.currentUsername)} / ${escapeHtml(letter.currentUserId)}` : '（記録なし）'}</p>
    <p><strong>投稿日時：</strong>${formatDate(letter.createdAt)}</p>
    <p><strong>ネタバレ：</strong>${letter.type === 'replyBookLetter' ? (letter.spoiler ? 'あり' : 'なし') : escapeHtml(letter.spoiler || 'なし')}</p>
    <p><strong>ジャンル：</strong>${escapeHtml(letter.genre || '未設定')}</p>
    <p><strong>気分タグ：</strong>${escapeHtml(letter.mood || letter.moodTags?.join('／') || 'なし')}</p>
    <p><strong>相談／通報：</strong>${reports.length ? `${reports.length}件` : 'なし'}</p>
    ${letter.holdReason ? `<p><strong>保留理由：</strong>${escapeHtml(letter.holdReason)}</p>` : ''}
    ${letter.deleteReason ? `<p><strong>削除理由：</strong>${escapeHtml(letter.deleteReason)}</p>` : ''}
    <div class="letter-body">${escapeHtml(letter.body)}</div>
    <h3>操作履歴</h3>
    <div class="admin-history">
      ${(letter.operationHistory?.length
        ? letter.operationHistory.map((h) => `<p>・${escapeHtml(h.label || h.action)}（${formatDate(h.at)}）</p>`).join('')
        : '<p>履歴はまだありません。</p>')}
    </div>
    <div class="actions admin-modal-actions">
      ${letter.status !== LETTER_STATUS.published && letter.status !== LETTER_STATUS.deleted ? `<button class="small-btn admin-action-publish" data-admin-action="publish" data-letter-id="${letter.id}">公開する</button>` : ''}
      ${(letter.status === LETTER_STATUS.pending || letter.status === LETTER_STATUS.published) ? `<button class="small-btn admin-action-hold" data-admin-action="hold" data-letter-id="${letter.id}">保留する</button>` : ''}
      ${letter.status === LETTER_STATUS.published ? `<button class="small-btn admin-action-private" data-admin-action="private" data-letter-id="${letter.id}">非公開にする</button>` : ''}
      ${letter.status === LETTER_STATUS.deleted ? `<button class="small-btn admin-action-restore" data-admin-action="restore" data-letter-id="${letter.id}">復元する</button>` : ''}
      ${letter.status === LETTER_STATUS.deleted
        ? `<button class="small-btn admin-action-hard-delete" data-admin-action="hard-delete" data-letter-id="${letter.id}">完全に削除する</button>`
        : `<button class="small-btn admin-action-delete" data-admin-action="delete" data-letter-id="${letter.id}">削除する</button>`}
      <button class="ghost" data-close-admin-modal>閉じる</button>
    </div>
  </article>`;

  modal.hidden = false;
}

function closeAdminModal() {
  const modal = document.querySelector('#admin-letter-modal');
  if (modal) modal.hidden = true;
}

function showAdminToast(message) {
  const toast = document.querySelector('#admin-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-show');
  clearTimeout(showAdminToast.timer);
  showAdminToast.timer = setTimeout(() => {
    toast.classList.remove('is-show');
  }, 2400);
}

function trimText(text, maxLength) {
  const value = String(text || '');
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
}

function formatDate(value) {
  if (!value) {
    return '日時不明';
  }
  return new Date(value).toLocaleString('ja-JP');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

ensureSeedData();
render();
