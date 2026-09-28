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
      <div class="auth-page-wrapper">
        <div class="auth-card-modal">
          <!-- LEFT: Auth Form Panel -->
          <div class="auth-card-left">
            <!-- Header bar: Back arrow & Language switcher -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
              <a href="#/" id="auth-back-btn" title="Back to home" style="color: #94a3b8; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; background: #161c32; border: 1px solid #232b49; transition: all 0.2s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </a>
              <div style="display: flex; align-items: center; gap: 8px;">
                ${i18n.renderLanguageSelector('auth-header-lang-select', 'padding: 6px 12px; font-size: 13px; font-weight: 600; background: #151b31; color: #cbd5e1; border-radius: 16px; border: 1px solid #252f52; cursor: pointer; outline: none;')}
              </div>
            </div>

            <!-- Title & Subtitle (matching user screenshot) -->
            <h1 style="font-size: 30px; font-weight: 700; color: #ffffff; margin: 0 0 8px 0; letter-spacing: -0.5px;">
              ${isRegister ? 'Register to system' : 'Login to system'}
            </h1>
            <p style="font-size: 14px; color: #94a3b8; margin: 0 0 22px 0; line-height: 1.5;">
              ${isRegister ? 'Please enter your information to register or ' : 'Please enter your login information or '}
              <a href="#" id="toggle-mode-btn" style="color: #38bdf8; text-decoration: none; font-weight: 600;">
                ${isRegister ? 'click here to sign in' : 'click here to registration'}
              </a>
            </p>

            <!-- Role Selector (Preserves stakeholder roles) -->
            <div style="margin-bottom: 22px;">
              <div class="role-pill-grid" id="role-tabs">
                <button type="button" class="role-pill role-tab ${initialRole === 'farmer' ? 'active' : ''}" data-role="farmer">
                  <span style="font-size: 14px;">🌾</span>
                  <span>${i18n.t('farmerRole')}</span>
                </button>
                <button type="button" class="role-pill role-tab ${initialRole === 'retailer' ? 'active' : ''}" data-role="retailer">
                  <span style="font-size: 14px;">🏪</span>
                  <span>${i18n.t('retailerRole')}</span>
                </button>
                <button type="button" class="role-pill role-tab ${initialRole === 'consumer' ? 'active' : ''}" data-role="consumer">
                  <span style="font-size: 14px;">🛒</span>
                  <span>${i18n.t('consumerRole')}</span>
                </button>
                <button type="button" class="role-pill role-tab ${initialRole === 'intermediary' ? 'active' : ''}" data-role="intermediary">
                  <span style="font-size: 14px;">📦</span>
                  <span>${i18n.t('intermediaryRole')}</span>
                </button>
                <button type="button" class="tab role-tab ${initialRole === 'admin' ? 'active' : ''}" data-role="admin" style="display:none;"></button>
              </div>
            </div>

            <!-- Form -->
            <form id="auth-form" style="display: flex; flex-direction: column;">
              ${isRegister ? `
                <div class="system-input-group">
                  <label class="system-label">${i18n.t('auth_new.fullName')}</label>
                  <input type="text" class="system-glass-input" id="auth-name" placeholder="John Doe" required />
                </div>
                <div class="system-input-group">
                  <label class="system-label">${i18n.t('auth_new.phonePlaceholder')}</label>
                  <input type="tel" class="system-glass-input" id="auth-phone" placeholder="+91 98765 43210" required />
                </div>
                <div class="system-input-group">
                  <label class="system-label">${i18n.t('auth_new.locationPlaceholder')}</label>
                  <input type="text" class="system-glass-input" id="auth-location" placeholder="City, State" required />
                </div>
                ${initialRole === 'farmer' ? `
                  <div class="system-input-group">
                    <label class="system-label">${i18n.t('auth_new.farmSizePlaceholder')}</label>
                    <input type="text" class="system-glass-input" id="auth-farmsize" placeholder="5 Acres" />
                  </div>
                  <div class="system-input-group">
                    <label class="system-label">${i18n.t('auth_new.cropsPlaceholder')}</label>
                    <input type="text" class="system-glass-input" id="auth-crops" placeholder="Wheat, Rice" />
                  </div>
                ` : ''}
              ` : ''}

              <!-- Username / Email Field -->
              <div class="system-input-group">
                <label class="system-label">Username</label>
                <input type="email" class="system-glass-input" id="auth-email" placeholder="example@farmchain.org" required autocomplete="username" />
              </div>

              <!-- Password Field -->
              <div class="system-input-group">
                <label class="system-label">Password</label>
                <div style="position: relative; display: flex; align-items: center; width: 100%;">
                  <input type="password" class="system-glass-input" id="auth-password" placeholder="••••••••" required autocomplete="current-password" style="padding-right: 48px;" />
                  <button type="button" id="toggle-password-btn" title="Show or hide password" aria-label="Toggle password visibility" class="system-password-eye-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>

              ${isRegister ? `
                <div class="system-input-group">
                  <label class="system-label">${i18n.t('auth_new.confirmPassword')}</label>
                  <div style="position: relative; display: flex; align-items: center; width: 100%;">
                    <input type="password" class="system-glass-input" id="auth-password-confirm" placeholder="••••••••" required style="padding-right: 48px;" />
                    <button type="button" id="toggle-confirm-password-btn" title="Show or hide password" aria-label="Toggle confirm password visibility" class="system-password-eye-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                  </div>
                </div>
              ` : ''}

              <!-- Remember Me & Forgot Password -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; margin-bottom: 24px; ${isRegister ? 'display: none;' : ''}">
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #8e9cb5; cursor: pointer; user-select: none;">
                  <input type="checkbox" id="auth-remember" style="accent-color: #6366f1; width: 16px; height: 16px; border-radius: 4px; cursor: pointer;" checked />
                  Remember me
                </label>
                <a href="#" style="font-size: 13px; color: #8e9cb5; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='#8e9cb5'">
                  ${i18n.t('auth_new.forgotPassword')}
                </a>
              </div>

              <!-- Submit Button (Glowing pill shape identical to image) -->
              <div>
                <button type="submit" class="system-pill-btn" id="submit-auth-btn">
                  ${isRegister ? i18n.t('auth_new.signUpBtn') : 'Log In'}
                </button>
              </div>
            </form>

            <!-- Quick Demo Credentials for Judges -->
            <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid #1c233c; ${isRegister ? 'display: none;' : ''}">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; justify-content: space-between;">
                <span>${i18n.t('auth_new.quickDemo')}</span>
                <button type="button" id="toggle-otp-modal-btn" style="background: none; border: none; color: #38bdf8; font-size: 11px; cursor: pointer; font-weight: 600; padding: 0;">📱 Phone OTP</button>
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;" id="demo-quick-buttons">
                ${DEMO_CREDENTIALS.map(demo => `
                  <button type="button" class="demo-fill-btn" data-email="${demo.email}" data-pass="${demo.password}" data-role="${demo.role}" style="font-size: 12px; padding: 8px 10px; background: #14192e; border: 1px solid #232b49; border-radius: 10px; color: #e2e8f0; text-align: left; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease;">
                    <span style="font-weight: 500;">${demo.avatar} ${demo.name.split(' ')[0]}</span>
                    <span style="color: #38bdf8; font-size: 10px; font-weight: 600; text-transform: capitalize;">${i18n.t(`roles.${demo.role}`) || demo.role}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Phone OTP Section (Collapsible) -->
            <div id="otp-container-section" style="display: none; margin-top: 18px; padding: 18px; background: #14192e; border: 1px solid #2a3458; border-radius: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-weight: 700; font-size: 13px; color: #ffffff;">📱 Phone OTP (Smart Account)</div>
                <button type="button" id="close-otp-section" style="background: none; border: none; color: #8e9cb5; cursor: pointer; font-size: 14px;">✕</button>
              </div>
              <div id="otp-phone-step">
                <div class="system-input-group" style="margin-bottom: 12px;">
                  <label class="system-label">Phone Number (+91)</label>
                  <input type="tel" class="system-glass-input" id="otp-phone" placeholder="+91 98765 43210" />
                </div>
                <button type="button" id="send-otp-btn" class="system-pill-btn" style="width: 100%; min-width: 0; padding: 10px 16px; font-size: 13px;">
                  📱 ${i18n.t('auth.sendOtpBtn')}
                </button>
                <div id="recaptcha-container"></div>
              </div>
              <div id="otp-verify-section" style="display: none;">
                <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">
                  Enter OTP sent to <strong id="confirmed-phone-display" style="color: #38bdf8;"></strong>
                  <button type="button" id="change-phone-btn" style="background: none; border: none; color: #38bdf8; cursor: pointer; font-size: 11px; text-decoration: underline; margin-left: 6px;">Change</button>
                </div>
                <div style="display: flex; gap: 6px; justify-content: center; margin-bottom: 12px;">
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                  <input type="text" maxlength="1" class="otp-digit-input" style="width: 36px; height: 40px; text-align: center; font-size: 16px; font-weight: 700; background: #0f1325; border: 1px solid #2b3558; border-radius: 8px; color: #ffffff;" />
                </div>
                <button type="button" id="verify-otp-btn" class="system-pill-btn" style="width: 100%; min-width: 0; padding: 10px 16px; font-size: 13px;">
                  ✅ ${i18n.t('auth.verifyOtpBtn')}
                </button>
                <div style="text-align: center; margin-top: 8px;">
                  <button type="button" id="resend-otp-btn" style="background: none; border: none; color: #94a3b8; font-size: 11px; cursor: pointer;">Resend code in 30s</button>
                </div>
              </div>
              <div id="otp-error-banner" style="display: none; margin-top: 10px; font-size: 11px; color: #f87171;"></div>
              <div id="otp-success-section" style="display: none; margin-top: 10px; text-align: center;"></div>
            </div>
          </div>

          <!-- RIGHT: Abstract Neon Flow Graphic Panel (matching reference screenshot) -->
          <div class="auth-card-right">
            <div class="auth-card-right-overlay"></div>
          </div>
        </div>

        <style>
          .auth-page-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
            background: radial-gradient(circle at 50% 40%, #3e4b85 0%, #2f3a6e 60%, #232c57 100%);
            box-sizing: border-box;
          }
          .auth-card-modal {
            width: 100%;
            max-width: 980px;
            min-height: 600px;
            background: #0f1325;
            border-radius: 28px;
            overflow: hidden;
            display: flex;
            box-shadow: 0 35px 80px -15px rgba(5, 8, 22, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06);
            position: relative;
          }
          .auth-card-left {
            flex: 1 1 50%;
            min-width: 320px;
            padding: 44px 44px 36px 44px;
            background: #0f1325;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            z-index: 2;
          }
          .auth-card-right {
            flex: 1 1 50%;
            position: relative;
            background: #0a0d1b url('/auth-neon-wave.jpg') center center / cover no-repeat;
            overflow: hidden;
            min-height: 480px;
          }
          .auth-card-right-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to right, rgba(15, 19, 37, 0.8) 0%, transparent 15%, transparent 85%, rgba(15, 19, 37, 0.3) 100%);
            pointer-events: none;
          }
          
          .system-input-group {
            margin-bottom: 20px;
            display: flex;
            flex-direction: column;
            position: relative;
          }
          .system-label {
            font-size: 13px;
            font-weight: 500;
            color: #8e9cb5;
            margin-bottom: 7px;
            letter-spacing: 0.2px;
            display: block;
          }
          .system-glass-input,
          .system-underline-input {
            width: 100% !important;
            height: 48px !important;
            background: rgba(22, 28, 54, 0.65) !important;
            backdrop-filter: blur(14px) !important;
            -webkit-backdrop-filter: blur(14px) !important;
            border: 1px solid rgba(255, 255, 255, 0.18) !important;
            border-radius: 10px !important;
            padding: 0 16px !important;
            font-size: 15px !important;
            color: #ffffff !important;
            outline: none !important;
            box-sizing: border-box !important;
            line-height: normal !important;
            display: flex !important;
            align-items: center !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.08) !important;
            transition: all 0.25s ease !important;
            font-family: inherit !important;
          }
          .system-glass-input::placeholder,
          .system-underline-input::placeholder {
            color: #7b88a8 !important;
            font-size: 14px !important;
            line-height: normal !important;
          }
          .system-glass-input:hover,
          .system-underline-input:hover {
            border-color: rgba(255, 255, 255, 0.28) !important;
            background: rgba(26, 33, 62, 0.75) !important;
          }
          .system-glass-input:focus,
          .system-underline-input:focus {
            border-color: rgba(56, 189, 248, 0.7) !important;
            background: rgba(26, 33, 62, 0.85) !important;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.18), 0 6px 20px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.12) !important;
          }

          .system-password-eye-btn {
            position: absolute !important;
            right: 14px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            background: transparent !important;
            border: none !important;
            cursor: pointer !important;
            color: #8e9cb5 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 28px !important;
            height: 28px !important;
            padding: 0 !important;
            border-radius: 6px !important;
            transition: color 0.2s, background-color 0.2s !important;
            z-index: 2 !important;
          }
          .system-password-eye-btn:hover {
            color: #ffffff !important;
            background-color: rgba(255, 255, 255, 0.08) !important;
          }

          .system-pill-btn {
            background: linear-gradient(90deg, #6b21a8 0%, #4338ca 50%, #3b82f6 100%);
            color: #ffffff;
            border: none;
            border-radius: 9999px;
            padding: 13px 44px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.3px;
            cursor: pointer;
            box-shadow: 0 10px 25px -4px rgba(99, 102, 241, 0.5);
            transition: all 0.25s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 150px;
          }
          .system-pill-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px -4px rgba(99, 102, 241, 0.7);
            filter: brightness(1.1);
          }
          .system-pill-btn:active {
            transform: translateY(0);
          }

          .role-pill-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .role-pill {
            background: #151b31;
            border: 1px solid #232b49;
            border-radius: 10px;
            padding: 8px 4px;
            font-size: 12px;
            font-weight: 600;
            color: #8e9cb5;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .role-pill:hover {
            border-color: #38bdf8;
            color: #ffffff;
            background: #1b2340;
          }
          .role-pill.active {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(56, 189, 248, 0.35));
            border-color: #38bdf8;
            color: #ffffff;
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
          }

          .demo-fill-btn:hover {
            border-color: #38bdf8 !important;
            background: #1c2340 !important;
          }

          #auth-back-btn:hover {
            background: #232b49 !important;
            color: #ffffff !important;
            border-color: #38bdf8 !important;
          }

          @media (max-width: 880px) {
            .auth-card-modal {
              flex-direction: column;
              max-width: 520px;
            }
            .auth-card-right {
              display: none;
            }
            .auth-card-left {
              padding: 36px 24px;
            }
          }
        </style>
      </div>
    `;

    // Toggle Phone OTP Section
    container.querySelector('#toggle-otp-modal-btn')?.addEventListener('click', () => {
      const otpSection = document.getElementById('otp-container-section');
      if (otpSection) {
        const isHidden = otpSection.style.display === 'none';
        otpSection.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
          otpSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    container.querySelector('#close-otp-section')?.addEventListener('click', () => {
      const otpSection = document.getElementById('otp-container-section');
      if (otpSection) otpSection.style.display = 'none';
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
