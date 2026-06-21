// ===== DOM References =====
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearChat');
const statusText = document.getElementById('statusText');
const statusDot = document.querySelector('.status-dot');

// ===== State =====
let isProcessing = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ===== Utility Functions =====
function scrollToBottom() {
  requestAnimationFrame(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

function formatMessage(text) {
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  formatted = formatted.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>'
  );

  return formatted;
}

// ===== Status Indicator =====
function setStatus(state) {
  if (state === 'connected') {
    statusText.textContent = 'Connected';
    statusDot.style.background = '#22C55E';
    statusDot.style.boxShadow = '0 0 6px #22C55E';
  } else if (state === 'connecting') {
    statusText.textContent = 'Connecting...';
    statusDot.style.background = '#F59E0B';
    statusDot.style.boxShadow = '0 0 6px #F59E0B';
  } else {
    statusText.textContent = 'Disconnected';
    statusDot.style.background = '#EF4444';
    statusDot.style.boxShadow = '0 0 6px #EF4444';
  }
}

// ===== Message Rendering =====
function addMessage(content, type) {
  const welcome = messagesContainer.querySelector('.welcome-message');
  if (welcome && type === 'user') welcome.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = type === 'user' ? 'You' : 'M';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  if (type === 'bot') {
    contentDiv.innerHTML = formatMessage(content);
  } else {
    contentDiv.textContent = content;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

function showTypingIndicator() {
  const existing = document.getElementById('typingIndicator');
  if (existing) return;

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.id = 'typingIndicator';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'M';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  dots.innerHTML = '<span></span><span></span><span></span>';

  indicator.appendChild(avatar);
  indicator.appendChild(dots);
  messagesContainer.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

// ===== API Communication =====
async function sendMessage(query) {
  if (isProcessing) return;
  isProcessing = true;

  messageInput.disabled = true;
  sendButton.disabled = true;

  addMessage(query, 'user');
  showTypingIndicator();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    removeTypingIndicator();

    if (data.success) {
      addMessage(data.response, 'bot');
      setStatus('connected');
      reconnectAttempts = 0;
    } else {
      addMessage('Sorry, something went wrong. Please try again.', 'bot');
    }
  } catch (error) {
    removeTypingIndicator();
    if (error.name === 'AbortError') {
      addMessage('⏳ Request timed out. The server might still be initializing. Please try again.', 'bot');
    } else {
      addMessage('⚠️ Connection error. Please check if the server is running.', 'bot');
      setStatus('disconnected');
      tryReconnect();
    }
    console.error('Chat error:', error);
  } finally {
    isProcessing = false;
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
  }
}

// ===== Reconnection =====
async function tryReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    setStatus('disconnected');
    return;
  }

  reconnectAttempts++;
  setStatus('connecting');

  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
  await new Promise(r => setTimeout(r, delay));

  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      setStatus('connected');
      reconnectAttempts = 0;
      loadStats();
    } else {
      tryReconnect();
    }
  } catch {
    tryReconnect();
  }
}

// ===== Clear Chat =====
function clearChat() {
  document.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());

  if (!messagesContainer.querySelector('.welcome-message')) {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-message';
    welcome.innerHTML = `
      <div class="welcome-icon">🛍️</div>
      <h2>Welcome to Myntra AI Assistant!</h2>
      <p>I have analyzed Myntra.com and can help you with:</p>
      <div class="welcome-features">
        <span>🏷️ Brands & Products</span>
        <span>📂 Categories</span>
        <span>🔥 Deals & Offers</span>
        <span>📦 Product Information</span>
      </div>
      <p class="welcome-hint">Ask me anything about Myntra shopping!</p>
    `;
    messagesContainer.appendChild(welcome);
  }
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K — focus input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    messageInput.focus();
  }
  // Escape — clear input
  if (e.key === 'Escape' && document.activeElement === messageInput) {
    messageInput.value = '';
    messageInput.blur();
  }
});

// ===== Sidebar Toggle (Mobile) =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebar = document.querySelector('.sidebar');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}

// Close sidebar on chip click (mobile)
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// ===== Event Listeners =====
sendButton.addEventListener('click', () => {
  const query = messageInput.value.trim();
  if (query) {
    messageInput.value = '';
    sendMessage(query);
  }
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const query = messageInput.value.trim();
    if (query) {
      messageInput.value = '';
      sendMessage(query);
    }
  }
});

clearButton.addEventListener('click', clearChat);

// Existing suggestion chips (additional close-sidebar logic)
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const query = chip.dataset.query;
    if (query) sendMessage(query);
  });
});

// ===== Load Stats =====
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();

    if (data.success) {
      document.getElementById('statProducts').textContent = data.stats.products || 0;
      document.getElementById('statBrands').textContent = data.stats.brands || 0;
      document.getElementById('statCategories').textContent = data.stats.categories || 0;
      document.getElementById('statDeals').textContent = data.stats.deals || 0;
      document.getElementById('statPolicies').textContent = data.stats.policies || 0;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    setStatus('disconnected');
    tryReconnect();
  }
}

// ===== Initialize =====
setStatus('connecting');
loadStats();
messageInput.focus();

// Auto-resize input
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});
