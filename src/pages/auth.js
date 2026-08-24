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

            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.06), rgba(59, 130, 246, 0.06)); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: var(--radius-md); padding: 14px;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--accent-purple); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                📱 Phone OTP Login <span class="badge badge-purple" style="font-size: 0.6rem;">ERC-4337</span>
              </div>
              <p style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 10px;">No MetaMask, no seed phrase — your smart wallet is created automatically via Account Abstraction.</p>
              <div style="display: flex; gap: 8px;" id="otp-login-section">
                <input type="tel" class="form-input" id="otp-phone" placeholder="+91 98765 43210" style="flex: 1; font-size: 0.82rem;" />
                <button type="button" class="btn btn-primary btn-sm" id="send-otp-btn" style="white-space: nowrap;">📱 Send OTP</button>
              </div>
              <div id="otp-verify-section" style="display: none; margin-top: 10px;">
                <div style="display: flex; gap: 8px;">
                  <input type="text" class="form-input" id="otp-code" placeholder="6-digit OTP" maxlength="6" style="flex: 1; font-size: 0.82rem; text-align: center; letter-spacing: 6px; font-weight: 700;" />
                  <button type="button" class="btn btn-primary btn-sm" id="verify-otp-btn" style="white-space: nowrap;">✅ Verify</button>
                </div>
                <div id="otp-hint" style="font-size: 0.7rem; color: var(--accent-green); margin-top: 6px;"></div>
              </div>
              <div id="otp-success-section" style="display: none; margin-top: 10px; padding: 10px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); border-radius: var(--radius-sm); text-align: center;"></div>
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
    container.querySelector('#send-otp-btn')?.addEventListener('click', async () => {
      const phone = document.getElementById('otp-phone')?.value.trim();
      if (!phone || phone.length < 10) {
        showToast('Please enter a valid phone number', 'warning');
        return;
      }

      const sendBtn = container.querySelector('#send-otp-btn');
      sendBtn.disabled = true;
      sendBtn.textContent = '⏳ Sending...';

      try {
        GaslessProvider.init();
        const result = await GaslessProvider.loginWithPhone(phone);

        // Show verify section
        const verifySection = document.getElementById('otp-verify-section');
        const hint = document.getElementById('otp-hint');
        if (verifySection) verifySection.style.display = 'block';
        if (hint) hint.textContent = `🔑 Demo OTP: ${result.otp} (Auto-displayed for hackathon judges)`;

        sendBtn.textContent = '✅ OTP Sent';
        sendBtn.style.background = 'var(--accent-green)';
        sendBtn.style.borderColor = 'var(--accent-green)';

        showToast(`OTP sent to ${phone}! Check the hint below.`, 'success');
      } catch (err) {
        showToast('Failed to send OTP: ' + err.message, 'error');
        sendBtn.disabled = false;
        sendBtn.textContent = '📱 Send OTP';
      }
    });

    container.querySelector('#verify-otp-btn')?.addEventListener('click', async () => {
      const phone = document.getElementById('otp-phone')?.value.trim();
      const otp = document.getElementById('otp-code')?.value.trim();
      if (!otp || otp.length !== 6) {
        showToast('Please enter the 6-digit OTP', 'warning');
        return;
      }

      const verifyBtn = container.querySelector('#verify-otp-btn');
      verifyBtn.disabled = true;
      verifyBtn.textContent = '⏳ Verifying...';

      try {
        const result = await GaslessProvider.verifyOtpAndCreateAccount(phone, otp);
        const selectedRole = container.querySelector('.role-tab.active')?.dataset.role || 'farmer';

        // Show success
        const successSection = document.getElementById('otp-success-section');
        if (successSection) {
          successSection.style.display = 'block';
          successSection.innerHTML = `
            <div style="font-size: 1.5rem; margin-bottom: 6px;">✅</div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-green);">Smart Wallet Created!</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
              Your blockchain wallet was created automatically — <strong>no seed phrase needed!</strong>
            </div>
            <div style="font-size: 0.65rem; color: var(--accent-cyan); margin-top: 6px; font-family: monospace;">
              Wallet: ${result.account.address.slice(0, 10)}...${result.account.address.slice(-8)}
            </div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">
              Type: ${result.account.type} · Gas: Sponsored by Paymaster
            </div>
          `;
        }

        // Auto-login after 1.5 seconds
        showToast('🎉 Smart wallet created! Logging you in...', 'success');

        setTimeout(() => {
          store.login(selectedRole, `phone-${phone}`, {
            id: `phone-${phone}`,
            role: selectedRole,
            name: `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`,
            email: `${phone}@farmchain.phone`,
            phone: phone,
            loginMethod: 'Phone OTP (ERC-4337)',
            walletAddress: result.account.address,
          });

          router.navigate(`/${selectedRole}/dashboard`);
        }, 1500);

      } catch (err) {
        showToast('OTP verification failed: ' + err.message, 'error');
        verifyBtn.disabled = false;
        verifyBtn.textContent = '✅ Verify';
      }
    });
  }

  renderForm();
}
