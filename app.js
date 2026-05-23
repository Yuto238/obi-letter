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
    moderationStatus: letter.moderationStatus || (letter.status === 'sealed' ? 'sealed' : 'deliverable'),
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
  return letter.type === 'normalLetter' && !letter.opened && letter.moderationStatus === 'deliverable';
}

function canShowOnShelf(letter) {
  return canReceiveRandom(letter) && letter.deliveryMode === 'shelfAndRandom';
}

function canReceiveDirect(letter, receiverName) {
  return letter.type === 'replyBookLetter'
    && !letter.opened
    && letter.moderationStatus === 'deliverable'
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
  renderAdminStats();
  renderAdminLetters();
  renderAdminReports();
  renderAdminUsers();

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
}

function renderAdminStats() {
  const stats = document.querySelector('#admin-stats');
  const letters = loadLetters();
  const reports = loadReports();
  const users = loadUsers();

  const pendingCount = letters.filter((letter) => letter.moderationStatus === 'pending').length;
  const replyCount = letters.filter((letter) => letter.type === 'replyBookLetter').length;

  // ユーザー関連統計
  const usersWhoWrote = new Set(letters.filter((l) => l.currentUserId).map((l) => l.currentUserId));
  const usersWhoReplied = new Set(letters.filter((l) => l.type === 'replyBookLetter' && l.currentUserId).map((l) => l.currentUserId));
  const usersWhoReported = new Set(reports.filter((r) => r.currentUserId).map((r) => r.currentUserId));

  stats.innerHTML = `
    <article class="stat-card"><h2>${letters.length}</h2><p>投稿された手紙</p></article>
    <article class="stat-card"><h2>${pendingCount}</h2><p>未確認の手紙</p></article>
    <article class="stat-card"><h2>${reports.length}</h2><p>相談の件数</p></article>
    <article class="stat-card"><h2>${replyCount}</h2><p>一冊の本の手紙</p></article>
    <article class="stat-card"><h2>${users.length}</h2><p>利用者数</p></article>
    <article class="stat-card"><h2>${usersWhoWrote.size}</h2><p>手紙を書いた利用者</p></article>
    <article class="stat-card"><h2>${usersWhoReplied.size}</h2><p>一冊の本を送った利用者</p></article>
    <article class="stat-card"><h2>${usersWhoReported.size}</h2><p>相談した利用者</p></article>
  `;
}

function renderAdminLetters() {
  const el = document.querySelector('#admin-letters');
  const letters = loadLetters();

  if (!letters.length) {
    el.innerHTML = '<div class="empty">投稿された手紙はありません。</div>';
    return;
  }

  el.innerHTML = letters.map((letter) => adminLetterCard(letter)).join('');

  el.querySelectorAll('[data-letter-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lettersData = loadLetters().map((letter) => {
        if (letter.id !== btn.dataset.letterId) {
          return letter;
        }
        return { ...letter, moderationStatus: btn.dataset.letterAction };
      });
      saveLetters(lettersData);
      render('admin');
    });
  });

  el.querySelectorAll('[data-consultation-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lettersData = loadLetters().map((letter) => {
        if (letter.id !== btn.dataset.letterId) {
          return letter;
        }
        return { ...letter, consultationStatus: 'resolved' };
      });
      saveLetters(lettersData);
      render('admin');
    });
  });

  el.querySelectorAll('[data-toggle-detail]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(`#detail-${btn.dataset.toggleDetail}`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.textContent = expanded ? '詳細を開く' : '詳細を閉じる';
      target.hidden = expanded;
    });
  });
}

function adminLetterCard(letter) {
  const summary = trimText(letter.body, 120);
  const typeLabel = letter.type === 'replyBookLetter' ? '一冊の本の手紙' : '通常の手紙';
  const consultation = letter.consultationStatus === 'resolved' ? '相談対応済み' : '相談未対応';

  return `<article class="ops-card">
    <p class="eyebrow">${typeLabel} / ${deliveryStatusLabel(letter)}</p>
    <h3>${escapeHtml(letter.letterTitle)}</h3>
    <p><strong>差出人名：</strong>${escapeHtml(letter.senderName)}</p>
    <p><strong>利用者：</strong>${letter.currentUsername ? `${escapeHtml(letter.currentUsername)} / ${escapeHtml(letter.currentUserId)}` : '（記録なし）'}</p>
    <p><strong>宛先名：</strong>${escapeHtml(letter.recipientName || '指定なし')}</p>
    <p><strong>元になった手紙ID：</strong>${escapeHtml(letter.parentLetterId || 'なし')}</p>
    <p><strong>本のタイトル：</strong>${escapeHtml(letter.bookTitle)} ／ <strong>著者名：</strong>${escapeHtml(letter.author)}</p>
    <p class="hint">${escapeHtml(summary)}</p>
    <div class="meta">
      ${letter.type === 'normalLetter' ? `<span class="pill">ジャンル：${escapeHtml(letter.genre || '未設定')}</span>` : ''}
      <span class="pill">ネタバレ：${letter.type === 'replyBookLetter' ? (letter.spoiler ? 'あり' : 'なし') : escapeHtml(letter.spoiler || 'なし')}</span>
      <span class="pill">${consultation}</span>
      <span class="pill">投稿：${formatDate(letter.createdAt)}</span>
    </div>
    <div class="actions">
      <button class="small-btn" data-toggle-detail="${letter.id}" aria-expanded="false">詳細を開く</button>
      <button class="small-btn" data-letter-id="${letter.id}" data-letter-action="reviewed">目を通した</button>
      <button class="small-btn" data-letter-id="${letter.id}" data-letter-action="deliverable">配達できます</button>
      <button class="small-btn" data-letter-id="${letter.id}" data-letter-action="sealed">封を閉じる</button>
      ${letter.type === 'replyBookLetter' ? `<button class="small-btn" data-letter-id="${letter.id}" data-consultation-action="resolved">相談対応済み</button>` : ''}
    </div>
    <div class="admin-detail" id="detail-${letter.id}" hidden>
      <h4>手紙詳細</h4>
      <p><strong>種別：</strong>${typeLabel}</p>
      <p><strong>差出人名：</strong>${escapeHtml(letter.senderName)}</p>
      <p><strong>宛先名：</strong>${escapeHtml(letter.recipientName || '指定なし')}</p>
      <p><strong>元になった手紙ID：</strong>${escapeHtml(letter.parentLetterId || 'なし')}</p>
      <p><strong>本のタイトル：</strong>${escapeHtml(letter.bookTitle)}</p>
      <p><strong>著者名：</strong>${escapeHtml(letter.author)}</p>
      <p><strong>投稿日時：</strong>${formatDate(letter.createdAt)}</p>
      <p><strong>ステータス：</strong>${deliveryStatusLabel(letter)}</p>
      ${letter.type === 'replyBookLetter' ? `<p><strong>この本を選んだ理由：</strong>${escapeHtml(letter.reason)}</p>` : ''}
      ${letter.type === 'replyBookLetter' ? `<p><strong>あなたへ：</strong>${escapeHtml(letter.message)}</p>` : ''}
      <div class="letter-body">${escapeHtml(letter.body)}</div>
    </div>
  </article>`;
}

function deliveryStatusLabel(letter) {
  if (letter.opened) {
    return '配達済み';
  }

  const map = {
    pending: '未確認',
    reviewed: '目を通した',
    deliverable: '配達できます',
    sealed: '封を閉じています',
  };

  return map[letter.moderationStatus] || '未確認';
}

function renderAdminReports() {
  const el = document.querySelector('#admin-reports');
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
      <p><strong>差出人名：</strong>${escapeHtml(linkedLetter?.senderName || '不明')}</p>
      <p><strong>宛先名：</strong>${escapeHtml(linkedLetter?.recipientName || '指定なし')}</p>
      <p><strong>相談理由：</strong>${escapeHtml(report.reason)}</p>
      <p><strong>相談本文：</strong>${escapeHtml(report.content || '記載なし')}</p>
      <p class="hint">相談日時：${formatDate(report.createdAt)}</p>
      <div class="actions">
        <button class="small-btn" data-resolve-report="${report.id}">対応済みにする</button>
      </div>
    </article>`;
  }).join('');

  el.querySelectorAll('[data-resolve-report]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = loadReports().map((report) => (
        report.id === btn.dataset.resolveReport
          ? { ...report, status: 'resolved', resolvedAt: new Date().toISOString() }
          : report
      ));
      saveReports(updated);
      render('admin');
    });
  });
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

  // 検索フィールドのバインド（初回のみ）
  const searchInput = document.querySelector('#admin-user-search');
  if (searchInput && !searchInput.dataset.bound) {
    searchInput.dataset.bound = '1';
    searchInput.addEventListener('input', () => renderAdminUsers(searchInput.value));
  }

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
