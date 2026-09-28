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
      <div style="min-height: 100vh; display: flex; background: var(--background);">
        <!-- LEFT: Visual / Branding Area (Hidden on small screens) -->
        <div style="flex: 1; display: none; background: url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80') center/cover; position: relative; overflow: hidden; border-right: 1px solid var(--border);" id="auth-visual-panel">
          <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(7, 26, 18, 0.85) 0%, rgba(14, 165, 233, 0.6) 100%); backdrop-filter: blur(4px);"></div>
          
          <div style="position: relative; z-index: 10; padding: 60px; display: flex; flex-direction: column; justify-content: center; height: 100%; color: #FFFFFF;">
            <div style="margin-bottom: auto;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 12px; backdrop-filter: blur(10px);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-12.5.5-16.5-5-20"/><path d="M14 20c-5.5-12.5-.5-16.5 5-20"/></svg>
                </div>
                <h2 style="font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">FarmChain AI 2.0</h2>
              </div>
            </div>

            <div style="max-width: 500px;">
              <h1 style="font-size: 48px; font-weight: 800; margin: 0 0 24px 0; line-height: 1.1; letter-spacing: -1px;">Grow Trust.<br/><span style="color: var(--brand-amber);">Earn More.</span></h1>
              
              <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 32px;">
                <div style="display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
                  <div style="color: var(--brand-amber);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.292 1.292L3 12l5.8 1.9a2 2 0 0 1 1.292 1.292L12 21l1.9-5.8a2 2 0 0 1 1.292-1.292L21 12l-5.8-1.9a2 2 0 0 1-1.292-1.292Z"/></svg></div>
                  <div><div style="font-weight: 600; font-size: 1.1rem;">AI Grading</div><div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">Automated objective crop quality analysis</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
                  <div style="color: #38BDF8;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>
                  <div><div style="font-weight: 600; font-size: 1.1rem;">GPS Verification</div><div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">Authentic harvest origin mapping</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
                  <div style="color: #4ADE80;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
                  <div><div style="font-weight: 600; font-size: 1.1rem;">Blockchain Provenance</div><div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">Immutable supply-chain records on Polygon</div></div>
                </div>
                <div style="display: flex; align-items: center; gap: 16px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
                  <div style="color: #F8FAFC;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                  <div><div style="font-weight: 600; font-size: 1.1rem;">Direct Farmer Payments</div><div style="font-size: 0.85rem; color: rgba(255,255,255,0.7);">Transparent smart-contract settlements</div></div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: auto; font-size: 0.8rem; color: rgba(255,255,255,0.5);">
              © 2026 FarmChain AI. All rights reserved.
            </div>
          </div>
        </div>

        <!-- RIGHT: Clean Authentication Card -->
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; position: relative; background: var(--background);">
          <!-- Top Right Language/Theme Toggle -->
          <div style="position: absolute; top: 24px; right: 24px;">
             ${i18n.renderLanguageSelector('auth-header-lang-select', 'padding: 8px 16px; font-size: 14px; font-weight: 600; background: var(--surface); color: var(--text-primary); border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-soft); cursor: pointer;')}
          </div>

          <div class="saas-card" style="width: 100%; max-width: 460px; padding: 40px; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0;">${isRegister ? 'Create an Account' : 'Welcome back'}</h2>
              <p style="font-size: 15px; color: var(--text-secondary); margin: 0;">${isRegister ? 'Join the agricultural revolution' : 'Sign in to your account'}</p>
            </div>

            <!-- Role Selection -->
            <div style="margin-bottom: 24px;">
              <div style="display: grid; grid-template-columns: repeat(4, 1fr) 48px; gap: 4px; background: var(--surface-secondary); padding: 4px; border-radius: 12px; border: 1px solid var(--border);" id="role-tabs">
                <button type="button" class="tab role-tab ${initialRole === 'farmer' ? 'active' : ''}" data-role="farmer" title="Farmer">${roleIcons.farmer}</button>
                <button type="button" class="tab role-tab ${initialRole === 'intermediary' ? 'active' : ''}" data-role="intermediary" title="Intermediary">${roleIcons.intermediary}</button>
                <button type="button" class="tab role-tab ${initialRole === 'retailer' ? 'active' : ''}" data-role="retailer" title="Retailer">${roleIcons.retailer}</button>
                <button type="button" class="tab role-tab ${initialRole === 'consumer' ? 'active' : ''}" data-role="consumer" title="Consumer">${roleIcons.consumer}</button>
                <button type="button" class="tab role-tab ${initialRole === 'admin' ? 'active' : ''}" data-role="admin" title="Admin">${roleIcons.admin}</button>
              </div>
            </div>

            <!-- Form -->
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 16px;">
              ${isRegister ? `
                <div><input type="text" class="saas-input" id="auth-name" placeholder="Full Name" required /></div>
                <div><input type="tel" class="saas-input" id="auth-phone" placeholder="Phone Number" required /></div>
                <div><input type="text" class="saas-input" id="auth-location" placeholder="Location (e.g. Nashik, MH)" required /></div>
                ${initialRole === 'farmer' ? `
                  <div><input type="text" class="saas-input" id="auth-farmsize" placeholder="Farm Size (e.g. 5 Acres)" /></div>
                  <div><input type="text" class="saas-input" id="auth-crops" placeholder="Primary Crops (e.g. Tomatoes, Onion)" /></div>
                ` : ''}
              ` : ''}

              <div>
                <input type="email" class="saas-input" id="auth-email" placeholder="Email Address" required />
              </div>
              <div>
                <input type="password" class="saas-input" id="auth-password" placeholder="Password" required />
              </div>
              
              ${isRegister ? `
                <div>
                  <input type="password" class="saas-input" id="auth-password-confirm" placeholder="Confirm Password" required />
                </div>
              ` : ''}
              
              <div style="display: flex; justify-content: flex-end; margin-top: -8px; ${isRegister ? 'display: none;' : ''}">
                <a href="#" style="font-size: 13px; color: var(--primary); font-weight: 500; text-decoration: none;">Forgot password?</a>
              </div>

              <button type="submit" class="saas-btn" id="submit-auth-btn" style="margin-top: 8px;">
                ${isRegister ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div style="text-align: center; margin-top: 24px; font-size: 14px; color: var(--text-secondary);">
              ${isRegister ? 'Already have an account? ' : 'New to FarmChain? '}
              <a href="#" id="toggle-mode-btn" style="color: var(--primary); font-weight: 600; text-decoration: none;">${isRegister ? 'Sign In' : 'Create Account'}</a>
            </div>

            <!-- Quick Demo Credentials for Judges -->
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); ${isRegister ? 'display: none;' : ''}">
              <div style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">Quick Demo Access</div>
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
        </div>

        <style>
          @media (min-width: 900px) {
            #auth-visual-panel { display: flex !important; }
          }
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
