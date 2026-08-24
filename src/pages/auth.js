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
          <!-- Top Header / Back -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="logo" style="cursor: pointer;" onclick="window.location.hash='/'">
              <div class="logo-icon">⛓️</div>
              <span style="font-family: var(--font-display); font-size: 1.2rem; font-weight: 700;">FarmChain <span class="text-gradient">AI</span></span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.location.hash='/'">← Back Home</button>
          </div>

          <!-- Auth Card -->
          <div class="card animate-fade-in-up" style="background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(16px); border: 1px solid var(--border-subtle); padding: 32px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px;">
                ${isRegisterMode ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">
                ${isRegisterMode ? 'Register as a stakeholder on the decentralized marketplace' : 'Log in to access your role-specific dashboard'}
              </p>
            </div>

            <!-- Role Selector Tabs -->
            <div style="margin-bottom: 20px;">
              <label class="form-label" style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted);">Select Stakeholder Role</label>
              <div style="display: flex; gap: 4px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: var(--radius-md); overflow-x: auto;" id="role-tabs">
                <button type="button" class="tab role-tab ${initialRole === 'farmer' ? 'active' : ''}" data-role="farmer">🌾 Farmer</button>
                <button type="button" class="tab role-tab ${initialRole === 'intermediary' ? 'active' : ''}" data-role="intermediary">🏪 Intermediary</button>
                <button type="button" class="tab role-tab ${initialRole === 'retailer' ? 'active' : ''}" data-role="retailer">🛒 Retailer</button>
                <button type="button" class="tab role-tab ${initialRole === 'consumer' ? 'active' : ''}" data-role="consumer">👤 Consumer</button>
                <button type="button" class="tab role-tab ${initialRole === 'admin' ? 'active' : ''}" data-role="admin">🔧 Admin</button>
              </div>
            </div>

            <form id="auth-form" style="display: flex; flex-direction: column; gap: 14px;">
              ${isRegisterMode ? `
                <div class="form-group">
                  <label class="form-label">Full Name / Organization</label>
                  <input type="text" class="form-input" id="auth-name" placeholder="e.g. Ramesh Patel or FreshCo Ltd" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Location (District, State)</label>
                  <input type="text" class="form-input" id="auth-location" placeholder="e.g. Nashik, Maharashtra" required />
                </div>
              ` : ''}

              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input" id="auth-email" placeholder="name@farmchain.demo" required />
              </div>

              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" class="form-input" id="auth-password" placeholder="••••••••" required />
              </div>

              <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px; justify-content: center;" id="submit-auth-btn">
                ${isRegisterMode ? '🚀 Complete Registration' : '🔑 Sign In'}
              </button>
            </form>

            <!-- Phone OTP Login (Account Abstraction) -->
            <div style="display: flex; align-items: center; margin: 18px 0; color: var(--text-muted); font-size: 0.75rem;">
              <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
              <span style="padding: 0 10px;">OR LOGIN WITHOUT WALLET</span>
              <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
            </div>

            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(59, 130, 246, 0.06)); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: var(--radius-md); padding: 16px;">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--accent-purple); margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px;">📱 Phone OTP Login</span>
                <span class="badge badge-purple" style="font-size: 0.65rem;">ERC-4337</span>
              </div>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4;">
                Receive an OTP on your mobile notification bar. No MetaMask, no seed phrase — your smart wallet is auto-created.
              </p>
              
              <!-- Phone Input Step -->
              <div id="otp-phone-step">
                <div style="display: flex; gap: 8px;">
                  <div style="display: flex; align-items: center; background: rgba(0,0,0,0.3); padding: 0 10px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">
                    🇮🇳 +91
                  </div>
                  <input type="tel" class="form-input" id="otp-phone" placeholder="98765 43210" maxlength="10" style="flex: 1; font-size: 0.88rem; font-family: var(--font-display); letter-spacing: 1px;" />
                  <button type="button" class="btn btn-primary btn-sm" id="send-otp-btn" style="white-space: nowrap; padding: 8px 14px;">📱 Send OTP</button>
                </div>
              </div>

              <!-- 6-Digit OTP Verification Step -->
              <div id="otp-verify-section" style="display: none; margin-top: 14px;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                  <span>📲 Look at the notification on top of your screen & enter 6-digit code:</span>
                </div>

                <div class="otp-digits-container" id="otp-digits-group">
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="0" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="1" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="2" data-index="2" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="3" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="4" autocomplete="off" />
                  <input type="text" inputmode="numeric" class="otp-digit-input" maxlength="1" data-index="5" autocomplete="off" />
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                  <button type="button" id="resend-otp-btn" style="background: none; border: none; font-size: 0.72rem; color: var(--accent-purple); cursor: pointer; text-decoration: underline; padding: 0;">
                    Resend code
                  </button>
                  <button type="button" class="btn btn-primary btn-sm" id="verify-otp-btn" style="padding: 6px 16px; font-weight: 700;">
                    ✅ Verify & Enter
                  </button>
                </div>
              </div>

              <div id="otp-success-section" style="display: none; margin-top: 12px; padding: 12px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25); border-radius: var(--radius-md); text-align: center;"></div>
            </div>

            <div style="display: flex; align-items: center; margin: 18px 0; color: var(--text-muted); font-size: 0.75rem;">
              <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
              <span style="padding: 0 10px;">OR QUICK DEMO LOGIN</span>
              <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
            </div>

            <!-- Quick Demo Credentials for Judges -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px;" id="demo-quick-buttons">
              ${DEMO_CREDENTIALS.map(demo => `
                <button class="btn btn-secondary btn-sm demo-fill-btn" data-email="${demo.email}" data-pass="${demo.password}" data-role="${demo.role}" style="font-size: 0.72rem; padding: 6px 8px; text-align: left;">
                  ${demo.avatar} ${demo.name.split(' ')[0]} <span style="color: var(--text-muted);">(${demo.role})</span>
                </button>
              `).join('')}
            </div>

            <div style="text-align: center; margin-top: 20px; font-size: 0.82rem; color: var(--text-muted);">
              ${isRegisterMode ? 'Already have an account?' : "Don't have an account yet?"}
              <a href="javascript:void(0)" id="toggle-auth-mode" style="color: var(--accent-green); font-weight: 600; margin-left: 4px;">
                ${isRegisterMode ? 'Sign In' : 'Register Now'}
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
          showToast(`Account registered as ${selectedRole}! Welcome ${name} 🎉`, 'success');
        } else {
          authResult = await loginWithEmail(email, password);
          const activeRole = authResult?.user?.role || selectedRole;
          showToast(`Logged in successfully as ${activeRole}! 🌾`, 'success');
        }

        const targetRole = (authResult?.user?.role || selectedRole).toLowerCase();
        setTimeout(() => {
          router.navigate(`/${targetRole}/dashboard`);
        }, 150);
      } catch (err) {
        showToast(err.message || 'Authentication failed', 'error');
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
      resendBtn.textContent = `Resend in ${seconds}s`;

      clearInterval(resendTimer);
      resendTimer = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          resendBtn.textContent = `Resend in ${seconds}s`;
        } else {
          clearInterval(resendTimer);
          resendBtn.disabled = false;
          resendBtn.style.color = 'var(--accent-purple)';
          resendBtn.style.textDecoration = 'underline';
          resendBtn.textContent = 'Resend code';
        }
      }, 1000);
    }

    async function sendOtpAction() {
      const phoneInput = document.getElementById('otp-phone');
      const rawPhone = phoneInput?.value.trim();
      if (!rawPhone || rawPhone.length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'warning');
        phoneInput?.focus();
        return;
      }

      const sendBtn = container.querySelector('#send-otp-btn');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '⏳ Sending...';
      }

      try {
        GaslessProvider.init();
        await GaslessProvider.loginWithPhone(rawPhone);

        // Show verify section
        const verifySection = document.getElementById('otp-verify-section');
        if (verifySection) {
          verifySection.style.display = 'block';
          verifySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (sendBtn) {
          sendBtn.textContent = '✅ Sent';
          sendBtn.style.background = 'var(--accent-green)';
          sendBtn.style.borderColor = 'var(--accent-green)';
        }

        startResendCountdown();

        // Focus first digit box
        setTimeout(() => {
          const firstDigit = container.querySelector('.otp-digit-input[data-index="0"]');
          firstDigit?.focus();
        }, 100);

        showToast(`📲 OTP dispatched to ${rawPhone}! Check notification at top of screen`, 'success');
      } catch (err) {
        showToast('Failed to send OTP: ' + err.message, 'error');
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = '📱 Send OTP';
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
        showToast('Please enter the complete 6-digit verification code', 'warning');
        return;
      }

      const verifyBtn = container.querySelector('#verify-otp-btn');
      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = '⏳ Verifying...';
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
            <div style="font-weight: 800; font-size: 0.9rem; color: var(--accent-green);">Smart Contract Wallet Deployed!</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              Authenticated via Phone OTP — <strong>Zero seed phrase required.</strong>
            </div>
            <div style="font-size: 0.68rem; color: var(--accent-cyan); margin-top: 6px; font-family: monospace; word-break: break-all;">
              Wallet: ${result.account.address}
            </div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
              Type: ${result.account.type} · Gas: 100% Sponsored by Paymaster
            </div>
          `;
        }

        showToast('🎉 Smart account verified! Logging you in...', 'success');

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
        showToast(err.message || 'OTP verification failed', 'error');
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = '✅ Verify & Enter';
        }
      }
    });
  }

  renderForm();
}

