// frontend/src/pages/farmer/farming-assistant.js
// Farmer-friendly AI assistant interface
import { store } from '../../data/store.js';
import { renderSidebar } from '../../components/sidebar.js';
import { i18n } from '../../i18n/index.js';
import { FarmingAssistant } from '../../ai/farming-assistant.js';
import { getIcon } from '../../utils/icons.js';

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
              <div style="width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 20px; background: var(--surface); border: 1.5px solid var(--border); box-shadow: var(--shadow-soft); display: flex; align-items: center; justify-content: center; padding: 10px;">
                <img src="/logo.png" alt="FarmChain AI" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 440px; margin: 0 auto;">${i18n.t('assistant.welcome')}</p>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 14px; padding: 6px 14px; background: var(--surface-secondary); border: 1px solid var(--border); border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                ${getIcon('info', 13)}
                <span>${i18n.t('assistant.disclaimer')}</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; margin-bottom: 4px; scrollbar-width: none;" class="scroll-hidden">
            <button class="quick-action-btn" data-query="${i18n.t('assistant.cropDisease')}">${getIcon('flask', 14)} <span>${i18n.t('assistant.cropDisease')}</span></button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.weather')}">${getIcon('cloudSun', 14)} <span>${i18n.t('assistant.weather')}</span></button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.mandiPrice')}">${getIcon('barChart', 14)} <span>${i18n.t('assistant.mandiPrice')}</span></button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.myOrders')}">${getIcon('orders', 14)} <span>${i18n.t('assistant.myOrders')}</span></button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.delivery')}">${getIcon('delivery', 14)} <span>${i18n.t('assistant.delivery')}</span></button>
            <button class="quick-action-btn" data-query="${i18n.t('assistant.qualityHelp')}">${getIcon('award', 14)} <span>${i18n.t('assistant.qualityHelp')}</span></button>
          </div>

          <!-- Input Area -->
          <div class="card" style="padding: 12px; display: flex; align-items: flex-end; gap: 12px;">
            <button id="voice-btn" class="btn btn-icon" style="background: var(--surface-secondary); color: var(--text-primary); border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;" title="${i18n.t('assistant.speak')}">
              ${getIcon('mic', 18)}
            </button>
            
            <button id="image-btn" class="btn btn-icon" style="background: var(--surface-secondary); color: var(--text-primary); border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;" title="${i18n.t('assistant.photo')}">
              ${getIcon('camera', 18)}
            </button>
            <input type="file" id="image-upload" accept="image/*" style="display: none;">

            <div style="flex: 1; position: relative;">
              <textarea id="chat-input" placeholder="${i18n.t('assistant.placeholder')}"></textarea>
            </div>

            <button id="send-btn" class="btn btn-primary" style="border-radius: 50%; width: 44px; height: 44px; flex-shrink: 0; padding: 0; display: flex; align-items: center; justify-content: center;" title="${i18n.t('assistant.send')}">
              ${getIcon('send', 18)}
            </button>
          </div>
          
          <div id="recording-indicator" style="display: none; text-align: center; padding: 8px; color: #ef4444; font-size: 0.85rem; font-weight: 600;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; margin-right: 6px; animation: pulse 1.5s infinite;"></span>
            ${i18n.t('assistant.listening')} <span style="text-decoration: underline; cursor: pointer; color: var(--text-secondary); margin-left: 8px;" id="stop-listening-btn">${i18n.t('assistant.stopListening')}</span>
          </div>
        </div>
      </main>
    </div>
    <style>
      .quick-action-btn { background: var(--surface-secondary); border: 1px solid var(--border); color: var(--text-primary); padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px; }
      .quick-action-btn:hover { background: rgba(14,165,233,0.1); border-color: #0ea5e9; color: #0ea5e9; }
      .chat-row { display: flex; gap: 10px; align-items: flex-end; width: 100%; }
      .chat-row.user { justify-content: flex-end; }
      .chat-row.ai { justify-content: flex-start; }
      .chat-bubble { max-width: 75%; padding: 12px 16px; border-radius: 18px; font-size: 0.95rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; box-sizing: border-box; }
      .chat-bubble.user { background: var(--primary); color: white; border-bottom-right-radius: 4px; }
      .chat-bubble.ai { background: var(--surface-secondary); color: var(--text-primary); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
      #chat-input { box-sizing: border-box; width: 100%; min-height: 44px; max-height: 120px; padding: 12px 16px; border-radius: 22px; border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); resize: none; font-family: inherit; font-size: 0.95rem; line-height: 1.4; outline: none; transition: border-color 0.2s; overflow-y: auto; }
      #chat-input:focus { border-color: var(--primary); }
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
    const row = document.createElement('div');
    row.className = `chat-row ${sender}`;

    if (sender === 'ai') {
      const avatar = document.createElement('div');
      avatar.style.cssText = 'width:32px;height:32px;flex-shrink:0;border-radius:10px;background:var(--surface);border:1px solid var(--border);padding:4px;display:flex;align-items:center;justify-content:center;';
      avatar.innerHTML = `<img src="/logo.png" alt="AI" style="width:100%;height:100%;object-fit:contain;">`;
      row.appendChild(avatar);
    }

    const div = document.createElement('div');
    div.className = `chat-bubble ${sender}`;
    if (isHtml) div.innerHTML = text;
    else div.textContent = text;
    row.appendChild(div);

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendTyping() {
    const row = document.createElement('div');
    row.className = 'chat-row ai';

    const avatar = document.createElement('div');
    avatar.style.cssText = 'width:32px;height:32px;flex-shrink:0;border-radius:10px;background:var(--surface);border:1px solid var(--border);padding:4px;display:flex;align-items:center;justify-content:center;';
    avatar.innerHTML = `<img src="/logo.png" alt="AI" style="width:100%;height:100%;object-fit:contain;">`;
    row.appendChild(avatar);

    const div = document.createElement('div');
    div.className = 'chat-bubble ai typing';
    div.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    row.appendChild(div);

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return row;
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
      appendMessage('ai', result.error);
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
