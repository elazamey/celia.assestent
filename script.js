(() => {
  'use strict';

  const STORAGE_KEYS = {
    messages: 'celia.messages.v1',
    theme: 'celia.theme.v1',
    language: 'celia.language.v1',
    backendUrl: 'celia.backendUrl.v1'
  };

  const translations = {
    ar: {
      assistantLabel: 'المساعد الذكي', eyebrow: 'مساعدك في كل خطوة', welcomeTitle: 'مرحبًا، أنا Celia',
      welcomeCopy: 'اكتب سؤالك أو فكرتك، وسأساعدك بإجابة واضحة ومباشرة.', thinking: 'Celia تفكر...',
      inputLabel: 'اكتب رسالتك', inputPlaceholder: 'اكتب رسالتك هنا...', ready: 'جاهز للمحادثة',
      shortcutHint: 'Enter للإرسال · Shift+Enter لسطر جديد', send: 'إرسال', privacyNote: 'لا تضع مفاتيح API في الواجهة. تتم معالجة الطلبات عبر الخادم الخلفي.',
      settingsEyebrow: 'التخصيص', settingsTitle: 'إعدادات الاتصال', backendLabel: 'رابط الخادم الخلفي',
      backendHelp: 'يُستخدم هذا الرابط لإرسال الطلبات إلى نقطة النهاية /chat.', cancel: 'إلغاء', save: 'حفظ',
      requestError: 'تعذر الاتصال بالخادم. تحقق من الرابط ومن تشغيل الخادم.', emptyResponse: 'لم أستطع الحصول على رد.',
      userLabel: 'أنت', assistantLabelMeta: 'Celia', copied: 'تم النسخ', copy: 'نسخ'
    },
    en: {
      assistantLabel: 'AI assistant', eyebrow: 'Your assistant for every step', welcomeTitle: 'Hello, I’m Celia',
      welcomeCopy: 'Share a question or idea, and I’ll help with a clear, direct answer.', thinking: 'Celia is thinking...',
      inputLabel: 'Write your message', inputPlaceholder: 'Write your message here...', ready: 'Ready to chat',
      shortcutHint: 'Enter to send · Shift+Enter for a new line', send: 'Send', privacyNote: 'Never place API keys in the frontend. Requests are processed by the backend.',
      settingsEyebrow: 'Customize', settingsTitle: 'Connection settings', backendLabel: 'Backend URL',
      backendHelp: 'This URL is used to send requests to the /chat endpoint.', cancel: 'Cancel', save: 'Save',
      requestError: 'Could not connect to the backend. Check the URL and server status.', emptyResponse: 'I could not get a response.',
      userLabel: 'You', assistantLabelMeta: 'Celia', copied: 'Copied', copy: 'Copy'
    }
  };

  const $ = (selector) => document.querySelector(selector);
  const messagesEl = $('#messages');
  const welcomeCard = $('#welcomeCard');
  const form = $('#chatForm');
  const input = $('#messageInput');
  const sendButton = $('#sendButton');
  const typingIndicator = $('#typingIndicator');
  const statusEl = $('#connectionStatus');
  const settingsDialog = $('#settingsDialog');
  const settingsForm = $('#settingsForm');
  const backendInput = $('#backendUrl');
  let language = localStorage.getItem(STORAGE_KEYS.language) || 'ar';
  let messages = readMessages();
  let isSending = false;

  function readMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]');
      return Array.isArray(saved) ? saved.filter((item) => item && item.role && item.content) : [];
    } catch {
      return [];
    }
  }

  function saveMessages() {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages.slice(-60)));
  }

  function getBackendUrl() {
    const configured = window.CELIA_CONFIG?.BACKEND_URL;
    return (localStorage.getItem(STORAGE_KEYS.backendUrl) || configured || 'http://localhost:3000').replace(/\/$/, '');
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage;
    localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (translations[language][key]) element.textContent = translations[language][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (translations[language][key]) element.placeholder = translations[language][key];
    });
    $('#languageToggle').textContent = language === 'ar' ? 'EN' : 'ع';
    renderMessages();
  }

  function renderMarkdown(rawText) {
    const escaped = escapeHtml(String(rawText));
    const codeBlocks = [];
    let html = escaped.replace(/```([\s\S]*?)```/g, (_match, code) => {
      codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return `@@CODE_${codeBlocks.length - 1}@@`;
    });
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*)$/gm, '<strong>$1</strong>');
    html = html.replace(/^## (.*)$/gm, '<strong>$1</strong>');
    html = html.replace(/^# (.*)$/gm, '<strong>$1</strong>');
    html = html.replace(/^[-*] (.*)$/gm, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.split(/\n{2,}/).map((block) => block.startsWith('<ul>') || block.startsWith('<pre>') ? block : `<p>${block.replace(/\n/g, '<br>')}</p>`).join('');
    return html.replace(/@@CODE_(\d+)@@/g, (_match, index) => codeBlocks[Number(index)]);
  }

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function renderMessages() {
    messagesEl.innerHTML = '';
    welcomeCard.hidden = messages.length > 0;
    messages.forEach((message, index) => {
      const row = document.createElement('article');
      row.className = `message-row ${message.role}`;
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      bubble.innerHTML = renderMarkdown(message.content);
      const meta = document.createElement('div');
      meta.className = 'message-meta';
      meta.textContent = message.role === 'user' ? translations[language].userLabel : `${translations[language].assistantLabelMeta}${message.provider ? ` · ${message.provider}` : ''}`;
      bubble.append(meta);
      if (message.role === 'assistant') {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.type = 'button';
        copyButton.textContent = translations[language].copy;
        copyButton.addEventListener('click', () => copyText(message.content, copyButton));
        bubble.append(copyButton);
      }
      row.append(bubble);
      messagesEl.append(row);
      if (index === messages.length - 1) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  async function copyText(value, button) {
    try {
      await navigator.clipboard.writeText(value);
      const oldLabel = button.textContent;
      button.textContent = translations[language].copied;
      setTimeout(() => { button.textContent = oldLabel; }, 1200);
    } catch { /* Clipboard permissions may be unavailable on file:// pages. */ }
  }

  async function callBackend(userText) {
    const response = await fetch(`${getBackendUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return { response: data.response || translations[language].emptyResponse, provider: data.provider };
  }

  async function sendMessage(text) {
    if (isSending || !text.trim()) return;
    isSending = true;
    sendButton.disabled = true;
    statusEl.classList.remove('offline');
    input.value = '';
    resizeInput();
    messages.push({ role: 'user', content: text.trim() });
    saveMessages();
    renderMessages();
    typingIndicator.hidden = false;
    try {
      const result = await callBackend(text.trim());
      messages.push({ role: 'assistant', content: result.response, provider: result.provider });
      statusEl.querySelector('span').textContent = translations[language].ready;
    } catch (error) {
      messages.push({ role: 'assistant', content: `${translations[language].requestError}\n\n_${error.message}_` });
      statusEl.classList.add('offline');
      statusEl.querySelector('span').textContent = translations[language].requestError;
    } finally {
      saveMessages();
      typingIndicator.hidden = true;
      isSending = false;
      sendButton.disabled = false;
      renderMessages();
      input.focus();
    }
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    $('#themeToggle').textContent = theme === 'dark' ? '☾' : '☼';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener('input', resizeInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  document.querySelectorAll('.suggestion').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.prompt;
      resizeInput();
      input.focus();
    });
  });

  $('#themeToggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  $('#languageToggle').addEventListener('click', () => setLanguage(language === 'ar' ? 'en' : 'ar'));

  $('#settingsToggle').addEventListener('click', () => {
    backendInput.value = getBackendUrl();
    settingsDialog.showModal();
  });

  settingsForm.addEventListener('submit', (event) => {
    if (event.submitter?.value === 'cancel') return;
    event.preventDefault();
    const value = backendInput.value.trim().replace(/\/$/, '');
    if (value) localStorage.setItem(STORAGE_KEYS.backendUrl, value);
    settingsDialog.close();
  });

  applyTheme(localStorage.getItem(STORAGE_KEYS.theme) || 'light');
  setLanguage(language);
  renderMessages();
  resizeInput();
})();
