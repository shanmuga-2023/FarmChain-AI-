// src/pages/auth.js
// Firebase Authentication & Registration Page for all 5 Stakeholder Roles
// + Phone OTP Login (ERC-4337 Account Abstraction)

import { loginWithEmail, registerWithEmail, loginWithGoogle, DEMO_CREDENTIALS, clearRecaptchaVerifier, normalizeIndianPhone } from '../firebase/auth.js';
import { web3Service } from '../web3/provider.js';
import { GaslessProvider } from '../web3/gasless.js';
import { router } from '../utils/router.js';
import { showToast, getCropEmoji } from '../utils/helpers.js';
import { i18n } from '../i18n/index.js';
import { store } from '../data/store.js';
import { verifyBackendToken } from '../utils/api.js';

export function renderAuthPage(container) {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const initialRole = urlParams.get('role') || 'farmer';
  let isRegisterMode = false;

  function renderForm() {
    const isRegister = isRegisterMode;
    const roleIcons = {
      farmer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-12.5.5-16.5-5-20"/><path d="M14 20c-5.5-12.5-.5-16.5 5-20"/></svg>',
      intermediary: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
      retailer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.2 9.3a1 1 0 0 0 1 .7h10.4a1 1 0 0 0 1-.7L17 13"/><circle cx="9" cy="20" r="1"/><circle cx="15" cy="20" r="1"/></svg>',
      consumer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      admin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
    };

    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px 16px; background: var(--background); position: relative;">
        <!-- Top Right Language/Theme Toggle -->
        <div style="position: absolute; top: 24px; right: 24px;">
           ${i18n.renderLanguageSelector('auth-header-lang-select', 'padding: 8px 16px; font-size: 14px; font-weight: 600; background: var(--surface); color: var(--text-primary); border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-soft); cursor: pointer;')}
        </div>

        <div class="saas-card" style="width: 100%; max-width: 480px; padding: 40px; border-radius: 24px; box-shadow: var(--shadow-xl); border: 1px solid var(--border);">
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="#/" style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none; margin-bottom: 16px;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-12.5.5-16.5-5-20"/><path d="M14 20c-5.5-12.5-.5-16.5 5-20"/></svg>
              </div>
              <span style="font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">FarmChain</span>
            </a>
            <h2 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0;">${isRegister ? i18n.t('auth_new.createAccountTitle') : i18n.t('auth_new.welcomeBackTitle')}</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin: 0;">${isRegister ? i18n.t('auth_new.joinRevolution') : i18n.t('auth_new.signInSubtitle')}</p>
          </div>

            <!-- Role Selection -->
            <div style="margin-bottom: 24px;">
              <style>
                .role-card-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 12px;
                }
                .role-card {
                  background: var(--surface);
                  border: 1px solid var(--border);
                  border-radius: 12px;
                  padding: 12px;
                  text-align: center;
                  cursor: pointer;
                  transition: all 0.2s;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  gap: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                  outline: none;
                }
                .role-card:hover {
                  border-color: rgba(14, 165, 233, 0.4);
                  background: rgba(14, 165, 233, 0.02);
                }
                .role-card.active {
                  border-color: #0EA5E9;
                  background: #E0F2FE;
                  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
                }
                [data-theme="dark"] .role-card.active {
                  background: rgba(14, 165, 233, 0.15);
                  border-color: #0EA5E9;
                  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
                }
                .role-icon {
                  width: 36px; height: 36px;
                  border-radius: 10px;
                  background: var(--surface-secondary);
                  display: flex; align-items: center; justify-content: center;
                  color: var(--text-primary);
                  transition: all 0.2s;
                }
                .role-card.active .role-icon {
                  background: #0EA5E9;
                  color: #FFF;
                }
                .role-title {
                  font-weight: 800;
                  font-size: 0.95rem;
                  color: var(--text-primary);
                  margin-bottom: 2px;
                  white-space: normal;
                  line-height: 1.2;
                }
              </style>
              <div class="role-card-grid" id="role-tabs">
                <!-- Farmer -->
                <button type="button" class="role-card role-tab ${initialRole === 'farmer' ? 'active' : ''}" data-role="farmer">
                  <div class="role-icon">${roleIcons.farmer}</div>
                  <div class="role-title">${i18n.t('farmerRole')}</div>
                </button>
                <!-- Retailer -->
                <button type="button" class="role-card role-tab ${initialRole === 'retailer' ? 'active' : ''}" data-role="retailer">
                  <div class="role-icon">${roleIcons.retailer}</div>
                  <div class="role-title">${i18n.t('retailerRole')}</div>
                </button>
                <!-- Consumer -->
                <button type="button" class="role-card role-tab ${initialRole === 'consumer' ? 'active' : ''}" data-role="consumer">
                  <div class="role-icon">${roleIcons.consumer}</div>
                  <div class="role-title">${i18n.t('consumerRole')}</div>
                </button>
                <!-- Intermediary -->
                <button type="button" class="role-card role-tab ${initialRole === 'intermediary' ? 'active' : ''}" data-role="intermediary">
                  <div class="role-icon">${roleIcons.intermediary}</div>
                  <div class="role-title">${i18n.t('intermediaryRole')}</div>
                </button>
                <!-- Admin hidden -->
                <button type="button" class="tab role-tab ${initialRole === 'admin' ? 'active' : ''}" data-role="admin" style="display:none;"></button>
              </div>
            </div>

            <!-- Form -->
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
              ${isRegister ? `
                <div><input type="text" class="saas-input" id="auth-name" placeholder="${i18n.t('auth_new.fullName')}" required /></div>
                <div><input type="tel" class="saas-input" id="auth-phone" placeholder="${i18n.t('auth_new.phonePlaceholder')}" required /></div>
                <div><input type="text" class="saas-input" id="auth-location" placeholder="${i18n.t('auth_new.locationPlaceholder')}" required /></div>
                ${initialRole === 'farmer' ? `
                  <div><input type="text" class="saas-input" id="auth-farmsize" placeholder="${i18n.t('auth_new.farmSizePlaceholder')}" /></div>
                  <div><input type="text" class="saas-input" id="auth-crops" placeholder="${i18n.t('auth_new.cropsPlaceholder')}" /></div>
                ` : ''}
              ` : ''}

              <div>
                <input type="email" class="saas-input" id="auth-email" placeholder="${i18n.t('auth_new.emailPlaceholder')}" required />
              </div>
              <div style="position: relative; display: flex; align-items: center;">
                <input type="password" class="saas-input" id="auth-password" placeholder="${i18n.t('auth_new.passwordPlaceholder')}" required style="padding-right: 42px;" />
                <button type="button" id="toggle-password-btn" title="Show or hide password" aria-label="Toggle password visibility" style="position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.2s;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              
              ${isRegister ? `
                <div style="position: relative; display: flex; align-items: center;">
                  <input type="password" class="saas-input" id="auth-password-confirm" placeholder="${i18n.t('auth_new.confirmPassword')}" required style="padding-right: 42px;" />
                  <button type="button" id="toggle-confirm-password-btn" title="Show or hide password" aria-label="Toggle confirm password visibility" style="position: absolute; right: 12px; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px; transition: color 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: flex-end; margin-top: -8px; ${isRegister ? 'display: none;' : ''}">
                <a href="#" style="font-size: 13px; color: var(--primary); font-weight: 500; text-decoration: none;">${i18n.t('auth_new.forgotPassword')}</a>
              </div>

              <button type="submit" class="saas-btn" id="submit-auth-btn" style="margin-top: 8px;">
                ${isRegister ? i18n.t('auth_new.signUpBtn') : i18n.t('auth_new.signInBtn')}
              </button>
            </form>

            <div style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-secondary);">
              ${isRegister ? i18n.t('auth_new.alreadyHaveAccount') : i18n.t('auth_new.newToFarmChain')}
              <a href="#" id="toggle-mode-btn" style="color: var(--primary); font-weight: 600; text-decoration: none;">${isRegister ? i18n.t('auth_new.signInBtn') : i18n.t('auth_new.createAccountLink')}</a>
            </div>

            <!-- Quick Demo Credentials for Judges -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); ${isRegister ? 'display: none;' : ''}">
              <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">${i18n.t('auth_new.quickDemo')}</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="demo-quick-buttons">
                ${DEMO_CREDENTIALS.map(demo => `
                  <button class="demo-fill-btn" data-email="${demo.email}" data-pass="${demo.password}" data-role="${demo.role}" style="font-size: 13px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; color: var(--text-primary); text-align: left; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease;">
                    <span style="font-weight: 500;">${demo.avatar} ${demo.name.split(' ')[0]}</span>
                    <span style="color: var(--primary); font-size: 11px; font-weight: 600; text-transform: capitalize;">${i18n.t(`roles.${demo.role}`) || demo.role}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

        <style>
          .role-tab { 
            background: transparent; 
            border: none; 
            cursor: pointer; 
            padding: 10px 4px; 
            border-radius: 8px; 
            font-size: 14px;
            color: var(--text-muted);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .role-tab:hover { color: var(--primary); background: rgba(14, 165, 233, 0.05); }
          .role-tab.active {
            background: var(--surface);
            box-shadow: var(--shadow-soft);
            border: 1px solid var(--border);
            color: var(--primary);
          }
          .demo-fill-btn:hover {
            border-color: var(--primary) !important;
            box-shadow: var(--shadow-soft);
          }
        </style>
      </div>
    `;

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

        btn.style.transform = 'scale(0.98)';
        setTimeout(() => btn.style.transform = 'scale(1)', 150);
      });
    });

    // Toggle Register/Login Mode
    container.querySelector('#toggle-mode-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      renderForm();
    });

    // Role Tab Switching
    container.querySelectorAll('.role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (isRegisterMode) renderForm(); // re-render to show/hide role specific inputs
      });
    });

    // Password Visibility Toggles
    const eyeOpenSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
    const eyeClosedSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>`;

    const togglePassBtn = container.querySelector('#toggle-password-btn');
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const passInput = document.getElementById('auth-password');
        if (!passInput) return;
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = isPass ? eyeClosedSvg : eyeOpenSvg;
        togglePassBtn.style.color = isPass ? 'var(--primary)' : 'var(--text-muted)';
      });
    }

    const toggleConfirmPassBtn = container.querySelector('#toggle-confirm-password-btn');
    if (toggleConfirmPassBtn) {
      toggleConfirmPassBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const passConfirmInput = document.getElementById('auth-password-confirm');
        if (!passConfirmInput) return;
        const isPass = passConfirmInput.type === 'password';
        passConfirmInput.type = isPass ? 'text' : 'password';
        toggleConfirmPassBtn.innerHTML = isPass ? eyeClosedSvg : eyeOpenSvg;
        toggleConfirmPassBtn.style.color = isPass ? 'var(--primary)' : 'var(--text-muted)';
      });
    }



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
          const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === email.toLowerCase());
          isRegisterMode = false;
          renderForm();
          const emailInput = document.getElementById('auth-email');
          const passInput = document.getElementById('auth-password');
          if (emailInput) emailInput.value = email;
          if (passInput) passInput.value = demoMatch ? demoMatch.password : password;
          showToast(demoMatch ? `Account already exists. Switched to Sign In with demo password.` : i18n.t('auth.toasts.emailInUse'), 'warning');
          return;
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          const demoMatch = DEMO_CREDENTIALS.find(d => d.email.toLowerCase() === email.toLowerCase());
          if (demoMatch) {
            // Instant recovery for demo account
            const demoUser = {
              id: `${demoMatch.role}-001`,
              name: demoMatch.name,
              email: demoMatch.email,
              role: demoMatch.role,
              location: demoMatch.location,
              avatar: demoMatch.avatar,
              verified: true,
            };
            store.login(demoMatch.role, demoUser.id, demoUser);
            showToast(`Signed in as demo ${demoMatch.role} (${demoMatch.name})`, 'success');
            setTimeout(() => {
              router.navigate(`/${demoMatch.role}/dashboard`);
            }, 150);
            return;
          }
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
    let activePhone = '';

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
      const rawPhone = phoneInput?.value.trim() || activePhone;
      const formattedPhone = normalizeIndianPhone(rawPhone);

      if (!formattedPhone) {
        showToast(i18n.t('auth.toasts.invalidPhone'), 'warning');
        phoneInput?.focus();
        return;
      }

      activePhone = formattedPhone;

      const errorBanner = document.getElementById('otp-error-banner');
      if (errorBanner) {
        errorBanner.style.display = 'none';
        errorBanner.innerHTML = '';
      }

      const sendBtn = container.querySelector('#send-otp-btn');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = `⏳ ${i18n.t('auth.toasts.sendingOtp')}`;
      }

      try {
        GaslessProvider.init();
        const loginRes = await GaslessProvider.loginWithPhone(formattedPhone);

        // Transition UI: Hide phone step, show verify section
        const phoneStep = document.getElementById('otp-phone-step');
        const verifySection = document.getElementById('otp-verify-section');
        const phoneDisplay = document.getElementById('confirmed-phone-display');

        if (phoneDisplay) {
          phoneDisplay.textContent = loginRes.phone || formattedPhone;
        }

        if (phoneStep) {
          phoneStep.style.display = 'none';
        }

        if (verifySection) {
          verifySection.style.display = 'block';
          verifySection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Clear all digits and focus first digit
        const digitInputs = container.querySelectorAll('.otp-digit-input');
        digitInputs.forEach(d => { d.value = ''; d.classList.remove('filled'); });
        setTimeout(() => {
          digitInputs[0]?.focus();
        }, 100);

        startResendCountdown();

        showToast(i18n.t('auth.toasts.smsSent', { phone: loginRes.phone || formattedPhone }), 'success');
      } catch (err) {
        if (errorBanner) {
          errorBanner.style.display = 'block';
          if (err.message && err.message.toLowerCase().includes('billing')) {
            errorBanner.innerHTML = `
              <div style="display: flex; gap: 10px; align-items: flex-start;">
                <span style="font-size: 1.2rem; line-height: 1;">💳</span>
                <div>
                  <strong style="color: #F87171; display: block; margin-bottom: 4px;">Firebase Cloud Billing Required</strong>
                  <span>${err.message}</span>
                  <div style="margin-top: 8px; font-size: 0.74rem; color: #E2E8F0; background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 6px; line-height: 1.4;">
                    🔧 <strong>Manual Firebase Console Step:</strong> To send real SMS to mobile phones, upgrade your Firebase project <code>farmchainai</code> from Spark to the <strong>Blaze (Pay-as-you-go)</strong> plan in <strong>Firebase Console → Project Overview → Upgrade</strong>.
                  </div>
                </div>
              </div>
            `;
          } else {
            errorBanner.textContent = `⚠️ ${err.message || 'Failed to send OTP. Please try again.'}`;
          }
        }
        showToast(err.message || i18n.t('auth.toasts.otpSendFailed', { error: 'Service error' }), 'error');
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = `📱 ${i18n.t('auth.sendOtpBtn')}`;
        }
      }
    }

    container.querySelector('#send-otp-btn')?.addEventListener('click', sendOtpAction);

    // Change Phone Number handler (switches back to phone input)
    container.querySelector('#change-phone-btn')?.addEventListener('click', () => {
      const phoneStep = document.getElementById('otp-phone-step');
      const verifySection = document.getElementById('otp-verify-section');
      const sendBtn = container.querySelector('#send-otp-btn');
      const errorBanner = document.getElementById('otp-error-banner');

      if (verifySection) verifySection.style.display = 'none';
      if (phoneStep) phoneStep.style.display = 'block';
      if (errorBanner) errorBanner.style.display = 'none';
      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.textContent = `📱 ${i18n.t('auth.sendOtpBtn')}`;
      }

      clearRecaptchaVerifier('recaptcha-container');
      const phoneInput = document.getElementById('otp-phone');
      phoneInput?.focus();
    });

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
          if (index < digitInputs.length - 1) {
            digitInputs[index + 1].focus();
          } else {
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

    // Verification Submit Handler (pure Firebase verification)
    container.querySelector('#verify-otp-btn')?.addEventListener('click', async () => {
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
        const result = await GaslessProvider.verifyOtpAndCreateAccount(activePhone, otp);
        const selectedRole = container.querySelector('.role-tab.active')?.dataset.role || 'farmer';
        const firebaseUser = result.firebaseUser;
        const idToken = result.idToken;

        // Securely sync ID token to Node.js backend for verification via Firebase Admin SDK
        if (idToken) {
          verifyBackendToken(idToken, {
            role: selectedRole,
            phone: firebaseUser?.phoneNumber || activePhone,
            walletAddress: result.account?.address || '',
          }).catch(err => {
            console.warn('Backend token sync notice:', err.message);
          });
        }

        // Show success section
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

        // Check if user has an existing Firestore profile to preserve registered role
        let targetRole = selectedRole;
        let targetName = `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} User`;
        let targetLocation = 'India';

        if (firebaseUser) {
          try {
            const { db } = await import('../firebase/config.js');
            const { doc, getDoc, setDoc } = await import('firebase/firestore');
            if (db) {
              const userRef = doc(db, 'users', firebaseUser.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                const existingData = userSnap.data();
                if (existingData.role) targetRole = existingData.role;
                if (existingData.name) targetName = existingData.name;
                if (existingData.location) targetLocation = existingData.location;
              } else {
                await setDoc(userRef, {
                  id: firebaseUser.uid,
                  uid: firebaseUser.uid,
                  phoneNumber: firebaseUser.phoneNumber || activePhone,
                  phone: activePhone,
                  role: selectedRole,
                  name: targetName,
                  location: targetLocation,
                  walletAddress: result.account?.address || '',
                  loginMethod: 'Firebase Phone OTP (ERC-4337)',
                  createdAt: Date.now(),
                  verified: true,
                });
              }
            }
          } catch (firestoreErr) {
            console.warn('Firestore profile check notice:', firestoreErr.message);
          }
        }

        setTimeout(() => {
          store.login(targetRole, firebaseUser ? firebaseUser.uid : `phone-${activePhone}`, {
            id: firebaseUser ? firebaseUser.uid : `phone-${activePhone}`,
            role: targetRole,
            name: targetName,
            location: targetLocation,
            email: `${(activePhone || '').replace(/\+/g, '')}@farmchain.phone`,
            phone: activePhone,
            loginMethod: 'Firebase Phone OTP (ERC-4337)',
            walletAddress: result.account?.address || '',
          });

          const redirectPath = targetRole.toLowerCase() === 'consumer' ? '/consumer/marketplace' : `/${targetRole.toLowerCase()}/dashboard`;
          router.navigate(redirectPath);
        }, 1200);

      } catch (err) {
        showToast(err.message || i18n.t('errors.otpFailed'), 'error');
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = `✅ ${i18n.t('auth.verifyOtpBtn')}`;
        }
        // Clear inputs and refocus first digit on failure
        digitInputs.forEach(d => { d.value = ''; d.classList.remove('filled'); });
        digitInputs[0]?.focus();
      }
    });
  }

  renderForm();
}
