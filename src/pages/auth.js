// src/pages/auth.js
// Firebase Authentication & Registration Page for all 5 Stakeholder Roles

import { loginWithEmail, registerWithEmail, loginWithGoogle, DEMO_CREDENTIALS } from '../firebase/auth.js';
import { web3Service } from '../web3/provider.js';
import { router } from '../utils/router.js';
import { showToast, getCropEmoji } from '../utils/helpers.js';
import { i18n } from '../i18n/index.js';

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
  }

  renderForm();
}
