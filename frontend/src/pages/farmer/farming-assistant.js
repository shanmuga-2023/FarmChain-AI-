// frontend/src/pages/farmer/farming-assistant.js
// Farmer-friendly AI assistant interface
import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { i18n } from '../../i18n/index.js';
import { FarmingAssistant } from '../../ai/farming-assistant.js';

let assistantInstance = null;

export function renderFarmingAssistant(container) {
  const user = store.get('currentUser');
  if (!user) return;

  const sidebarContainer = document.createElement('div');
  renderSidebar(sidebarContainer);

  if (assistantInstance) assistantInstance.destroy();
  assistantInstance = new FarmingAssistant();

  container.innerHTML = `
    <div class="dashboard-layout">
      ${sidebarContainer.innerHTML}
      <main class="dashboard-main" style="display: flex; flex-direction: column; height: 100vh;">
        <header class="glass-header">
          <div class="header-left">
            <div>
              <h2 class="header-title">${i18n.t('assistant.title')}</h2>
              <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">${i18n.t('assistant.subtitle')}</div>
            </div>
          </div>
        </header>

        <div class="page-content" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding-bottom: 24px;">
          <!-- Chat Area -->
          <div id="chat-messages" class="card scroll-hidden" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; padding: 24px; margin-bottom: 16px; scroll-behavior: smooth;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 3rem; margin-bottom: 12px; animation: bounce 2s infinite;">🤖</div>
              <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 400px; margin: 0 auto;">${i18n.t('assistant.welcome')}</p>
              <div style="font-size: 0.75rem; color: var(--accent-amber); margin-top: 12px; padding: 8px; background: rgba(245,158,11,0.1); border-radius: 8px; display: inline-block;">
                ⚠️ ${i18n.t('assistant.disclaimer')}
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 4px; scrollbar-width: none;" class="scroll-hidden">
            <button class="quick-action-btn" data-query="${i18n.t('assistant.cropDisease')}">🌿 ${i18n.t('assistant.cropDisease')}</button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.weather')}">🌤️ ${i18n.t('assistant.weather')}</button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.mandiPrice')}">📊 ${i18n.t('assistant.mandiPrice')}</button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.myOrders')}">📋 ${i18n.t('assistant.myOrders')}</button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.delivery')}">🚚 ${i18n.t('assistant.delivery')}</button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.qualityHelp')}">⭐ ${i18n.t('assistant.qualityHelp')}</button>
          </div>

          <!-- Input Area -->
          <div class="card" style="padding: 12px; display: flex; align-items: flex-end; gap: 12px;">
            <button id="voice-btn" class="btn btn-icon" style="background: var(--surface-secondary); color: var(--text-primary); border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0;" title="${i18n.t('assistant.speak')}">
              🎤
            </button>
            
            <button id="image-btn" class="btn btn-icon" style="background: var(--surface-secondary); color: var(--text-primary); border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0;" title="${i18n.t('assistant.photo')}">
              📸
            </button>
            <input type="file" id="image-upload" accept="image/*" style="display: none;">

            <div style="flex: 1; position: relative;">
              <textarea id="chat-input" placeholder="${i18n.t('assistant.placeholder')}" style="width: 100%; min-height: 44px; max-height: 120px; padding: 12px 16px; border-radius: 22px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); resize: none; font-family: inherit; font-size: 0.95rem; line-height: 1.4; outline: none; transition: border-color 0.2s; overflow-y: auto;"></textarea>
            </div>

            <button id="send-btn" class="btn btn-primary" style="border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0; padding: 0; display: flex; align-items: center; justify-content: center;" title="${i18n.t('assistant.send')}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          
          <div id="recording-indicator" style="display: none; text-align: center; padding: 8px; color: #ef4444; font-size: 0.85rem; font-weight: 600; animation: pulse 1.5s infinite;">
            🔴 ${i18n.t('assistant.listening')} <span style="text-decoration: underline; cursor: pointer; color: var(--text-secondary); margin-left: 8px;" id="stop-listening-btn">${i18n.t('assistant.stopListening')}</span>
          </div>
        </div>
      </main>
    </div>
    <style>
      .quick-action-btn { background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-primary); padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
      .quick-action-btn:hover { background: rgba(14,165,233,0.1); border-color: #0ea5e9; color: #0ea5e9; }
      .chat-bubble { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
      .chat-bubble.user { background: var(--primary); color: white; border-bottom-right-radius: 4px; align-self: flex-end; }
      .chat-bubble.ai { background: var(--surface-secondary); color: var(--text-primary); border: 1px solid var(--border); border-bottom-left-radius: 4px; align-self: flex-start; }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      .typing-indicator span { display: inline-block; width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; margin: 0 2px; animation: type 1.4s infinite both; }
      .typing-indicator span:nth-child(1) { animation-delay: 0s; }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes type { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    </style>
  `;

  const chatMessages = container.querySelector('#chat-messages');
  const chatInput = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#send-btn');
  const voiceBtn = container.querySelector('#voice-btn');
  const imageBtn = container.querySelector('#image-btn');
  const imageUpload = container.querySelector('#image-upload');
  const recordingIndicator = container.querySelector('#recording-indicator');
  const stopListeningBtn = container.querySelector('#stop-listening-btn');

  function appendMessage(sender, text, isHtml = false) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${sender}`;
    if (isHtml) div.innerHTML = text;
    else div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'chat-bubble ai typing';
    div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return div;
  }

  async function handleSend(text, imageSrc = null) {
    if (!text && !imageSrc) return;
    
    // Auto-stop TTS when user sends a new message
    assistantInstance.synthesis?.cancel();

    if (imageSrc) {
      appendMessage('user', `<img src="${imageSrc}" style="max-width: 200px; border-radius: 8px;"><br>${text}`, true);
    } else {
      appendMessage('user', text);
    }

    const typing = appendTyping();
    const result = await assistantInstance.sendMessage(text, imageSrc);
    typing.remove();

    if (result.error) {
      appendMessage('ai', `❌ ${result.error}`);
    } else {
      // Format markdown-like bold/lists to simple HTML
      let formattedText = result.response
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      
      appendMessage('ai', formattedText, true);
      assistantInstance.speak(result.response);
    }
  }

  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) {
      handleSend(text);
      chatInput.value = '';
      chatInput.style.height = '44px';
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  chatInput.addEventListener('input', () => {
    chatInput.style.height = '44px';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  container.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSend(btn.dataset.query);
    });
  });

  // Voice Input
  voiceBtn.addEventListener('click', () => {
    if (assistantInstance.isListening) {
      assistantInstance.stopListening();
      recordingIndicator.style.display = 'none';
    } else {
      recordingIndicator.style.display = 'block';
      assistantInstance.startListening(
        (text) => {
          recordingIndicator.style.display = 'none';
          chatInput.value = text;
          sendBtn.click();
        },
        (err) => {
          recordingIndicator.style.display = 'none';
          console.warn('Voice error:', err);
          if (err !== 'no-speech' && err !== 'aborted') {
            showToast(`Voice input failed: ${err}`, 'error');
          }
        }
      );
    }
  });

  stopListeningBtn.addEventListener('click', () => {
    assistantInstance.stopListening();
    recordingIndicator.style.display = 'none';
  });

  // Image Input
  imageBtn.addEventListener('click', () => imageUpload.click());

  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image too large (max 2MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const q = prompt(i18n.t('assistant.placeholder'), i18n.t('assistant.cropDisease') + "?");
      handleSend(q || i18n.t('assistant.imageAnalysis'), src);
    };
    reader.readAsDataURL(file);
    imageUpload.value = ''; // reset
  });

  // Cleanup on unmount
  window.addEventListener('hashchange', () => {
    if (assistantInstance && window.location.hash !== '#/farmer/assistant') {
      assistantInstance.destroy();
      assistantInstance = null;
    }
  }, { once: true });
}
