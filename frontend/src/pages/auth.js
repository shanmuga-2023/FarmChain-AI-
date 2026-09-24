// src/pages/auth.js
// Firebase Authentication & Registration Page for all 5 Stakeholder Roles
// + Phone OTP Login (ERC-4337 Account Abstraction)

import { loginWithEmail, registerWithEmail, loginWithGoogle, DEMO_CREDENTIALS } from '../firebase/auth.js';
import { web3Service } from '../web3/provider.js';
import { GaslessProvider } from '../web3/gasless.js';
import { router } from '../utils/router.js';
import { showToast, getCropEmoji } from '../utils/helpers.js';
import { i18n } from '../i18n/index.js';
import { store } from '../data/store.js';

export function renderAuthPage(container) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const initialRole = urlParams.get('role') || 'farmer';
  let isRegisterMode = false;

  function renderForm() {
    container.innerHTML = `
      <div class="landing-page" style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 20px;">
        <div class="landing-bg-orbs">
          <div class="bg-orb bg-orb-1"></div>
          <div class="bg-orb bg-orb-2"></div>
        </div>

        <div style="width: 100%; max-width: 480px; position: relative; z-index: 10;">
          <!-- Top Header / Back & Language Selector -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="logo" style="cursor: pointer;" onclick="window.location.hash='/'">
              <div class="logo-icon">⛓️</div>
              <span style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700;">FarmChain <span class="text-gradient">AI</span></span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              ${i18n.renderLanguageSelector('auth-header-lang-select', 'padding: 5px 12px; font-size: 0.8rem; background: rgba(30, 41, 59, 0.9); color: #fff; border-radius: 20px; border: 1px solid rgba(255,255,255,0.25);')}
              <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/'">${i18n.t('auth.backHome')}</button>
            </div>
          </div>

          <!-- Auth Card -->
          <div class="card auth-card card-dark animate-fade-in-up" style="background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.14); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 24px rgba(44, 74, 62, 0.2); padding: 32px 30px; border-radius: var(--radius-lg);">
            <!-- Visual Anchor Header Area -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; background: rgba(74, 222, 128, 0.12); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 9999px; margin-bottom: 12px;">
                <span style="font-size: 0.8rem;">🔒</span>
                <span style="font-size: 0.72rem; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #86EFAC;">${i18n.t('auth.marketBadge')}</span>
              </div>
              <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; line-height: 1.15; margin: 0 0 8px 0; color: #FFFFFF; letter-spacing: -0.02em;">
                ${isRegisterMode ? i18n.t('auth.createAccount') : `${i18n.t('auth.welcome')} <span style="background: linear-gradient(135deg, #FDE047 0%, #4ADE80 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${i18n.t('auth.back')}</span>`}
              </h1>
              <p style="font-size: 0.92rem; color: #E2E8F0; font-weight: 400; line-height: 1.45; margin: 0 auto; max-width: 360px;">
                ${isRegisterMode ? i18n.t('auth.registerSubtitle') : i18n.t('auth.loginSubtitle')}
              </p>
              <!-- Elegant visual accent connecting header to role selector -->
              <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 14px;">
                <div style="flex: 1; max-width: 60px; height: 1px; background: linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.4));"></div>
                <span style="font-size: 0.75rem; color: #FCD34D; font-weight: 600;">🌾 🏪 🛒 👤</span>
                <div style="flex: 1; max-width: 60px; height: 1px; background: linear-gradient(90deg, rgba(74, 222, 128, 0.4), transparent);"></div>
              </div>
            </div>

            <!-- Role Selector Tabs -->
            <div style="margin-bottom: 22px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <label class="form-label" style="font-size: 0.78rem; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #E2E8F0; margin: 0;">${i18n.t('auth.selectRole')}</label>
                <span style="font-size: 0.7rem; color: #94A3B8; font-weight: 500;">${i18n.t('auth.roleSwitcher')}</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr) 52px; gap: 4px; background: rgba(0, 0, 0, 0.4); padding: 4px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.12);" id="role-tabs">
                <button type="button" class="tab role-tab ${initialRole === 'farmer' ? 'active' : ''}" data-role="farmer" style="justify-content: center; padding: 8px 4px; font-size: 0.78rem; font-weight: 600; color: #E2E8F0;">🌾 ${i18n.t('roles.farmer')}</button>
                <button type="button" class="tab role-tab ${initialRole === 'intermediary' ? 'active' : ''}" data-role="intermediary" style="justify-content: center; padding: 8px 4px; font-size: 0.78rem; font-weight: 600; color: #E2E8F0;">🏪 ${i18n.t('roles.intermediary')}</button>
                <button type="button" class="tab role-tab ${initialRole === 'retailer' ? 'active' : ''}" data-role="retailer" style="justify-content: center; padding: 8px 4px; font-size: 0.78rem; font-weight: 600; color: #E2E8F0;">🛒 ${i18n.t('roles.retailer')}</button>
                <button type="button" class="tab role-tab ${initialRole === 'consumer' ? 'active' : ''}" data-role="consumer" style="justify-content: center; padding: 8px 4px; font-size: 0.78rem; font-weight: 600; color: #E2E8F0;">👤 ${i18n.t('roles.consumer')}</button>
                <button type="button" class="tab role-tab ${initialRole === 'admin' ? 'active' : ''}" data-role="admin" title="${i18n.t('roles.admin')}" style="justify-content: center; padding: 8px 4px; font-size: 0.78rem; font-weight: 600; color: #94A3B8;">🔧</button>
              </div>
            </div>

            <form id="auth-form" style="display: flex; flex-direction: column; gap: 14px;">
              ${isRegisterMode ? `
                <div class="form-group">
                  <label class="form-label" style="color: #E2E8F0; font-weight: 600;">${i18n.t('auth.fullNameLabel')}</label>
                  <input type="text" class="form-input" id="auth-name" placeholder="${i18n.t('auth.fullNamePlaceholder')}" style="background: #0F172A; border: 1px solid rgba(255, 255, 255, 0.2); color: #FFFFFF;" required />
                </div>
                <div class="form-group">
                  <label class="form-label" style="color: #E2E8F0; font-weight: 600;">${i18n.t('auth.locationLabel')}</label>
                  <input type="text" class="form-input" id="auth-location" placeholder="${i18n.t('auth.locationPlaceholder')}" style="background: #0F172A; border: 1px solid rgba(255, 255, 255, 0.2); color: #FFFFFF;" required />
                </div>
              ` : ''}

              <div class="form-group">
                <label class="form-label" style="color: #E2E8F0; font-weight: 600;">${i18n.t('auth.emailLabel')}</label>
                <input type="email" class="form-input" id="auth-email" placeholder="${i18n.t('auth.emailPlaceholder')}" style="background: #0F172A; border: 1px solid rgba(255, 255, 255, 0.2); color: #FFFFFF;" required />
              </div>

              <div class="form-group">
                <label class="form-label" style="color: #E2E8F0; font-weight: 600;">${i18n.t('auth.passwordLabel')}</label>
                <input type="password" class="form-input" id="auth-password" placeholder="••••••••" style="background: #0F172A; border: 1px solid rgba(255, 255, 255, 0.2); color: #FFFFFF;" required />
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px; justify-content: center; font-weight: 700; font-size: 0.95rem; padding: 12px;" id="submit-auth-btn">
                ${isRegisterMode ? `🚀 ${i18n.t('auth.completeRegBtn')}` : `🔑 ${i18n.t('auth.signInBtn')}`}
              </button>
            </form>

            <!-- Phone OTP Login (Account Abstraction) -->
            <div style="display: flex; align-items: center; margin: 20px 0 16px 0; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.8px;">
              <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.18);"></div>
              <span style="padding: 0 12px; color: #E2E8F0;">${i18n.t('auth.orLoginWithoutWallet')}</span>
              <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.18);"></div>
            </div>

            <div style="background: rgba(147, 51, 234, 0.1); border: 1px solid rgba(168, 85, 247, 0.45); border-radius: var(--radius-md); padding: 18px;">
              <div style="font-size: 0.9rem; font-weight: 700; color: #E9D5FF; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 8px;">📱 ${i18n.t('auth.phoneOtpTitle')}</span>
                <span class="badge" style="background: rgba(168, 85, 247, 0.3); color: #FAF5FF; border: 1px solid rgba(168, 85, 247, 0.6); font-size: 0.68rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">ERC-4337</span>
              </div>
              <p style="font-size: 0.78rem; color: #CBD5E1; margin-bottom: 14px; line-height: 1.45;">
                ${i18n.t('auth.phoneOtpDesc')}
              </p>
              
              <!-- Phone Input Step -->
              <div id="otp-phone-step">
                <div style="display: flex; gap: 8px;">
                  <div style="display: flex; align-items: center; background: rgba(15, 23, 42, 0.85); padding: 0 12px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.22); font-size: 0.85rem; font-weight: 700; color: #F8FAFC;">
                    🇮🇳 +91
                  </div>
                  <input type="tel" class="form-input" id="otp-phone" placeholder="98765 43210" maxlength="10" style="flex: 1; font-size: 0.95rem; font-family: var(--font-mono); letter-spacing: 1.2px; background: #0F172A; border: 1px solid rgba(255, 255, 255, 0.22); color: #FFFFFF;" />
                  <button type="button" class="btn btn-primary btn-sm" id="send-otp-btn" style="white-space: nowrap; padding: 8px 16px; font-weight: 700;">📱 ${i18n.t('auth.sendOtpBtn')}</button>
                </div>
              </div>

              <!-- 6-Digit OTP Verification Step -->
              <div id="otp-verify-section" style="display: none; margin-top: 14px;">
                <div style="font-size: 0.78rem; color: #E2E8F0; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <span>📲 ${i18n.t('auth.otpPrompt')}</span>
                </div>

                <div class="otp-digits-container" id="otp-digits-group">
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="0" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="1" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="2" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="3" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="4" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="5" autocomplete="off" />
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <button type="button" id="resend-otp-btn" style="background: none; border: none; font-size: 0.75rem; color: #C084FC; cursor: pointer; text-decoration: underline; padding: 0; font-weight: 600;">
                    ${i18n.t('auth.resendCode')}
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" id="verify-otp-btn" style="padding: 6px 16px; font-weight: 700;">
                    ✅ ${i18n.t('auth.verifyAndEnter')}
                  </button>
                </div>
              </div>

              <div id="otp-success-section" style="display: none; margin-top: 12px; padding: 12px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.35); border-radius: var(--radius-md); text-align: center; color: #86EFAC; font-weight: 600; font-size: 0.85rem;"></div>
            </div>

            <div style="display: flex; align-items: center; margin: 20px 0 16px 0; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.8px;">
              <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.18);"></div>
              <span style="padding: 0 12px; color: #E2E8F0;">${i18n.t('auth.orQuickDemo')}</span>
              <div style="flex: 1; height: 1px; background: rgba(255, 255, 255, 0.18);"></div>
            </div>

            <!-- Quick Demo Credentials for Judges -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;" id="demo-quick-buttons">
              ${DEMO_CREDENTIALS.map(demo => `
                <button class="btn btn-secondary btn-sm demo-fill-btn" data-email="${demo.email}" data-pass="${demo.password}" data-role="${demo.role}" style="font-size: 0.76rem; padding: 8px 10px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.18); color: #F8FAFC; text-align: left; display: flex; align-items: center; justify-content: space-between;">
                  <span>${demo.avatar} ${demo.name.split(' ')[0]}</span>
                  <span style="color: #94A3B8; font-size: 0.7rem; font-weight: 600; text-transform: capitalize;">${i18n.t(`roles.${demo.role}`) || demo.role}</span>
                </button>
              `).join('')}
            </div>

            <div style="text-align: center; margin-top: 22px; font-size: 0.86rem; color: #CBD5E1;">
              ${isRegisterMode ? i18n.t('auth.alreadyHaveAccount') : i18n.t('auth.dontHaveAccount')}
              <a href="javascript:void(0)" id="toggle-auth-mode" style="color: #4ADE80; font-weight: 700; margin-left: 6px; text-decoration: underline;">
                ${isRegisterMode ? i18n.t('auth.signInBtn') : i18n.t('auth.registerNow')}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Role Tab Switching
    container.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Toggle Register / Login Mode
    container.querySelector('#toggle-auth-mode')?.addEventListener('click', () => {
      isRegisterMode = !isRegisterMode;
      renderForm();
    });

    // Quick Fill Buttons
    container.querySelectorAll('.demo-fill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        const pass = btn.dataset.pass;
        const role = btn.dataset.role;

        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        if (emailInput && passInput) {
          emailInput.value = email;
          passInput.value = pass;
        }

        // Highlight selected role
        container.querySelectorAll('.role-tab').forEach(t => {
          if (t.dataset.role === role) t.classList.add('active');
          else t.classList.remove('active');
        });

        // Trigger login
        document.getElementById('auth-form')?.requestSubmit();
      });
    });

    // Handle Form Submit
    container.querySelector('#auth-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email')?.value.trim();
      const password = document.getElementById('auth-password')?.value;
      const selectedRole = container.querySelector('.role-tab.active')?.dataset.role || 'farmer';

      try {
        let authResult;
        if (isRegisterMode) {
          const name = document.getElementById('auth-name')?.value.trim();
          const location = document.getElementById('auth-location')?.value.trim();

          const walletAddr = web3Service.address || '';
          authResult = await registerWithEmail(email, password, name, selectedRole, location, walletAddr);
          showToast(i18n.t('auth.toasts.registered', { role: i18n.t(`roles.${selectedRole}`), name }), 'success');
        } else {
          authResult = await loginWithEmail(email, password);
          const activeRole = authResult?.user?.role || selectedRole;
          showToast(i18n.t('auth.toasts.loggedIn', { role: i18n.t(`roles.${activeRole}`) }), 'success');
        }

        const targetRole = (authResult?.user?.role || selectedRole).toLowerCase();
        setTimeout(() => {
          router.navigate(`/${targetRole}/dashboard`);
        }, 150);
      } catch (err) {
        console.error('Auth error:', err);
        if (err.code === 'auth/email-already-in-use') {
          showToast(i18n.t('auth.toasts.emailInUse'), 'warning');
          isRegisterMode = false;
          renderForm();
          const emailInput = document.getElementById('auth-email');
          const passInput = document.getElementById('auth-password');
          if (emailInput) emailInput.value = email;
          if (passInput) passInput.value = password;
          return;
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          showToast(i18n.t('auth.toasts.invalidCreds'), 'error');
        } else if (err.code === 'auth/user-not-found') {
          showToast(i18n.t('auth.toasts.userNotFound'), 'warning');
        } else if (err.code === 'auth/weak-password') {
          showToast(i18n.t('auth.toasts.weakPassword'), 'warning');
        } else {
          showToast(err.message || i18n.t('errors.authFailed'), 'error');
        }
      }
    });

    // ==========================================
    // Phone OTP Login (Account Abstraction)
    // ==========================================
    let resendTimer = null;

    function startResendCountdown() {
      let seconds = 30;
      const resendBtn = container.querySelector('#resend-otp-btn');
      if (!resendBtn) return;

      resendBtn.disabled = true;
      resendBtn.style.color = 'var(--text-muted)';
      resendBtn.style.textDecoration = 'none';
      resendBtn.textContent = i18n.t('auth.resendIn', { s: seconds });

      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          resendBtn.textContent = i18n.t('auth.resendIn', { s: seconds });
        } else {
          clearInterval(resendTimer);
          resendBtn.disabled = false;
          resendBtn.style.color = 'var(--accent-purple)';
          resendBtn.style.textDecoration = 'underline';
          resendBtn.textContent = i18n.t('auth.resendCode');
        }
      }, 1000);
    }

    async function sendOtpAction() {
      const phoneInput = document.getElementById('otp-phone');
      const rawPhone = phoneInput?.value.trim();
      if (!rawPhone || rawPhone.length < 10) {
        showToast(i18n.t('auth.toasts.invalidPhone'), 'warning');
        phoneInput?.focus();
        return;
      }

      const sendBtn = container.querySelector('#send-otp-btn');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = `⏳ ${i18n.t('auth.toasts.sendingOtp')}`;
      }

      try {
        GaslessProvider.init();
        const loginRes = await GaslessProvider.loginWithPhone(rawPhone);

        // Show verify section
        const verifySection = document.getElementById('otp-verify-section');
        if (verifySection) {
          verifySection.style.display = 'block';
          verifySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (sendBtn) {
          sendBtn.textContent = `✅ ${i18n.t('auth.toasts.otpSent')}`;
          sendBtn.style.background = 'var(--accent-green)';
          sendBtn.style.borderColor = 'var(--accent-green)';
        }

        startResendCountdown();

        // Focus first digit box
        setTimeout(() => {
          const firstDigit = container.querySelector('.otp-digit-input[data-index="0"]');
          firstDigit?.focus();
        }, 100);

        if (loginRes.method === 'firebase') {
          showToast(i18n.t('auth.toasts.smsSent', { phone: rawPhone }), 'success');
        } else {
          showToast(i18n.t('auth.toasts.demoOtpDispatched'), 'info');
        }
      } catch (err) {
        showToast(i18n.t('auth.toasts.otpSendFailed', { error: err.message }), 'error');
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = `📱 ${i18n.t('auth.sendOtpBtn')}`;
        }
      }
    }

    container.querySelector('#send-otp-btn')?.addEventListener('click', sendOtpAction);
    container.querySelector('#resend-otp-btn')?.addEventListener('click', () => {
      const resendBtn = container.querySelector('#resend-otp-btn');
      if (resendBtn && !resendBtn.disabled) {
        sendOtpAction();
      }
    });

    // Setup 6-digit input auto-advancing, paste and backspace handlers
    const digitInputs = container.querySelectorAll('.otp-digit-input');
    digitInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length > 0) {
          input.classList.add('filled');
          // Move to next input if available
          if (index < digitInputs.length - 1) {
            digitInputs[index + 1].focus();
          } else {
            // All 6 digits filled, trigger auto-verify
            container.querySelector('#verify-otp-btn')?.click();
          }
        } else {
          input.classList.remove('filled');
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          digitInputs[index - 1].focus();
          digitInputs[index - 1].value = '';
          digitInputs[index - 1].classList.remove('filled');
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').trim().replace(/\D/g, '');
        if (pasted) {
          pasted.split('').slice(0, 6).forEach((char, i) => {
            if (digitInputs[i]) {
              digitInputs[i].value = char;
              digitInputs[i].classList.add('filled');
            }
          });
          const targetIndex = Math.min(pasted.length, 5);
          digitInputs[targetIndex].focus();
          if (pasted.length >= 6) {
            container.querySelector('#verify-otp-btn')?.click();
          }
        }
      });
    });

    // Verification Submit Handler
    container.querySelector('#verify-otp-btn')?.addEventListener('click', async () => {
      const phoneInput = document.getElementById('otp-phone');
      const rawPhone = phoneInput?.value.trim();

      // Gather 6 digits from individual boxes
      let otp = '';
      digitInputs.forEach(inp => { otp += inp.value.trim(); });

      if (!otp || otp.length !== 6) {
        showToast(i18n.t('auth.toasts.enterFullOtp'), 'warning');
        return;
      }

      const verifyBtn = container.querySelector('#verify-otp-btn');
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = `⏳ ${i18n.t('common.loading')}`;
      }

      try {
        const result = await GaslessProvider.verifyOtpAndCreateAccount(rawPhone, otp);
        const selectedRole = container.querySelector('.role-tab.active')?.dataset.role || 'farmer';

        // Show success
        const successSection = document.getElementById('otp-success-section');
        if (successSection) {
          successSection.style.display = 'block';
          successSection.innerHTML = `
            <div style="font-size: 1.6rem; margin-bottom: 4px;">🎉</div>
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--accent-green);">${i18n.t('auth.smartWalletDeployed')}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              ${i18n.t('auth.zeroSeedPhrase')}
            </div>
            <div style="font-size: 0.68rem; color: var(--accent-cyan); margin-top: 6px; font-family: monospace; word-break: break-all;">
              ${i18n.t('auth.walletLabel')}: ${result.account.address}
            </div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
              ${i18n.t('auth.sponsoredGas', { type: result.account.type })}
            </div>
          `;
        }

        showToast(i18n.t('auth.toasts.smartAccountVerified'), 'success');

        setTimeout(() => {
          store.login(selectedRole, `phone-${rawPhone}`, {
            id: `phone-${rawPhone}`,
            role: selectedRole,
            name: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`,
            email: `${rawPhone}@farmchain.phone`,
            phone: rawPhone,
            loginMethod: 'Phone OTP (ERC-4337)',
            walletAddress: result.account.address,
          });

          router.navigate(`/${selectedRole}/dashboard`);
        }, 1500);

      } catch (err) {
        showToast(err.message || i18n.t('errors.otpFailed'), 'error');
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = `✅ ${i18n.t('auth.verifyAndEnter')}`;
        }
      }
    });
  }

  renderForm();
}
