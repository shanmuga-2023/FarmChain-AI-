// ============================================
// FarmChain AI — Gasless Transaction Layer
// ERC-4337 Account Abstraction Simulation
// Abstracts blockchain complexity from farmers
// ============================================

/**
 * GaslessProvider — Simulates ERC-4337 Account Abstraction
 *
 * In production, this would integrate with:
 * - Biconomy SDK for UserOperation bundling
 * - Web3Auth for social/phone login
 * - A deployed Paymaster contract for gas sponsoring
 *
 * For the hackathon demo, we simulate the entire flow:
 * 1. Phone OTP login → auto-create smart account wallet
 * 2. Wrap transactions in UserOperations
 * 3. Paymaster "signs" and sponsors gas
 * 4. Bundler submits to chain
 *
 * All integration points are marked with:
 * // PRODUCTION: Replace with [SDK name]
 */

const GASLESS_STATE_KEY = 'farmchain_gasless';

// Simulated gas costs (based on Polygon Amoy testnet averages)
const GAS_COST_ESTIMATES = {
  registerProduct: { gas: 185000, costEth: 0.00037, costInr: 32 },
  createOrder: { gas: 210000, costEth: 0.00042, costInr: 36 },
  confirmDelivery: { gas: 95000, costEth: 0.00019, costInr: 16 },
  issueCertificate: { gas: 140000, costEth: 0.00028, costInr: 24 },
  logCheckpoint: { gas: 120000, costEth: 0.00024, costInr: 21 },
};

export class GaslessProvider {
  static _state = null;
  static _confirmationResult = null; // Firebase Phone Auth confirmation
  static _recaptchaVerifier = null;

  /**
   * Initialize gasless provider
   */
  static init() {
    this._loadState();
  }

  /**
   * Login with phone number — Firebase Phone Auth (Real SMS)
   * Sends a REAL SMS to the user's phone via Firebase.
   * Falls back to demo simulation ONLY if Firebase is offline.
   */
  static async loginWithPhone(phoneNumber) {
    // Normalize to E.164 format for Firebase (+91XXXXXXXXXX)
    let e164Phone = phoneNumber.trim().replace(/\s+/g, '');
    if (!e164Phone.startsWith('+')) {
      e164Phone = '+91' + e164Phone.replace(/^0+/, '');
    }

    // Try Firebase Phone Authentication first (sends REAL SMS)
    try {
      const { auth, isFirebaseReady } = await import('../firebase/config.js');
      const { signInWithPhoneNumber, RecaptchaVerifier } = await import('firebase/auth');

      if (!isFirebaseReady || !auth) throw new Error('Firebase offline');

      // Create invisible reCAPTCHA verifier (required by Firebase Phone Auth)
      if (!this._recaptchaVerifier) {
        // Create a container for reCAPTCHA if it doesn't exist
        let recaptchaContainer = document.getElementById('recaptcha-container');
        if (!recaptchaContainer) {
          recaptchaContainer = document.createElement('div');
          recaptchaContainer.id = 'recaptcha-container';
          recaptchaContainer.style.position = 'fixed';
          recaptchaContainer.style.bottom = '0';
          recaptchaContainer.style.right = '0';
          recaptchaContainer.style.zIndex = '99999';
          document.body.appendChild(recaptchaContainer);
        }

        this._recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('📱 reCAPTCHA verified — sending SMS...');
          },
          'expired-callback': () => {
            console.warn('⚠️ reCAPTCHA expired, resetting...');
            this._recaptchaVerifier = null;
          },
        });
      }

      console.log(`📱 Firebase Phone Auth: Sending real SMS to ${e164Phone}...`);

      // This triggers Firebase to send a REAL SMS to the user's phone
      this._confirmationResult = await signInWithPhoneNumber(auth, e164Phone, this._recaptchaVerifier);

      // Store pending auth (no OTP stored — only Firebase knows the code)
      this._state.pendingAuth = {
        phone: e164Phone,
        method: 'firebase',
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };
      this._saveState();

      console.log(`✅ Firebase SMS dispatched to ${e164Phone} — OTP is ONLY on the user's phone`);

      return { method: 'firebase', expiresIn: 300, phone: e164Phone };

    } catch (firebaseErr) {
      console.warn('⚠️ Firebase Phone Auth failed/offline:', firebaseErr);
      console.log('📱 Falling back to demo OTP mode...');

      // Fallback: demo simulation (only used if Firebase is offline or rejected)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      this._state.pendingAuth = {
        phone: e164Phone,
        otp,
        method: 'demo',
        createdAt: Date.now(),
        expiresAt: Date.now() + 300000,
      };
      this._saveState();

      // Show the demo banner with error reason in fallback mode
      this._renderDemoFallbackBanner(e164Phone, otp, firebaseErr.message || 'Firebase service unreachable');

      return { method: 'demo', otp, expiresIn: 300, phone: e164Phone, error: firebaseErr.message };
    }
  }

  /**
   * Verify OTP and create smart account
   * Uses Firebase confirmationResult.confirm() for real SMS verification.
   */
  static async verifyOtpAndCreateAccount(phoneNumber, inputOtp) {
    const pending = this._state.pendingAuth;

    if (!pending) {
      throw new Error('No pending authentication. Please request a new OTP.');
    }

    // === Firebase Real SMS Verification ===
    if (pending.method === 'firebase' && this._confirmationResult) {
      try {
        const credential = await this._confirmationResult.confirm(inputOtp.trim());
        const firebaseUser = credential.user;

        console.log('✅ Firebase Phone Auth verified! UID:', firebaseUser.uid);

        // Create smart account linked to Firebase UID
        const smartAccount = this._generateSmartAccount(firebaseUser.uid);
        smartAccount.firebaseUid = firebaseUser.uid;
        smartAccount.phoneNumber = firebaseUser.phoneNumber;
        smartAccount.loginMethod = 'Firebase Phone Auth + ERC-4337';

        this._state.currentAccount = smartAccount;
        this._state.isAuthenticated = true;
        this._state.pendingAuth = null;
        this._confirmationResult = null;
        this._saveState();

        return {
          success: true,
          account: smartAccount,
          firebaseUser,
          message: '✅ Phone verified via Firebase SMS — Smart wallet created!',
        };

      } catch (err) {
        if (err.code === 'auth/invalid-verification-code') {
          throw new Error('Wrong OTP. Please check the SMS on your phone and try again.');
        }
        if (err.code === 'auth/code-expired') {
          throw new Error('OTP expired. Please request a new code.');
        }
        throw new Error('Verification failed: ' + (err.message || 'Unknown error'));
      }
    }

    // === Demo Fallback Verification ===
    if (pending.method === 'demo') {
      if (Date.now() > pending.expiresAt) {
        throw new Error('OTP expired. Please request a new one.');
      }

      if (pending.otp !== inputOtp.trim()) {
        throw new Error('Invalid OTP. Check the notification banner and try again.');
      }

      // Dismiss demo banner
      const banner = document.getElementById('floating-mobile-sms-banner');
      if (banner) banner.remove();

      const smartAccount = this._generateSmartAccount(phoneNumber);

      this._state.currentAccount = smartAccount;
      this._state.isAuthenticated = true;
      this._state.pendingAuth = null;
      this._saveState();

      return {
        success: true,
        account: smartAccount,
        message: '✅ Smart account created (demo mode)',
      };
    }

    throw new Error('No valid verification session found. Please request a new OTP.');
  }

  /**
   * Demo fallback banner — only shown when Firebase is offline
   */
  static _renderDemoFallbackBanner(phone, otp, reason = 'Firebase Phone Auth offline') {
    const existing = document.getElementById('floating-mobile-sms-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'floating-mobile-sms-banner';
    banner.className = 'mobile-sms-push-banner animate-slide-down';
    banner.innerHTML = `
      <div class="sms-push-inner">
        <div class="sms-push-header">
          <div class="sms-push-app">
            <span class="sms-push-icon">⚠️</span>
            <span class="sms-push-appname">DEMO MODE</span>
            <span class="sms-push-bullet">•</span>
            <span class="sms-push-time">Live SMS offline</span>
          </div>
          <button class="sms-push-close" id="close-sms-push">✕</button>
        </div>
        <div class="sms-push-content">
          <div class="sms-push-sender">FarmChain Demo OTP (${reason})</div>
          <div class="sms-push-body">
            Live SMS unavailable (${reason}). Your demo code is <strong class="sms-highlight-code">${otp}</strong>
          </div>
        </div>
        <div class="sms-push-actions">
          <button type="button" class="sms-copy-btn" id="sms-copy-otp-btn">📋 Copy ${otp}</button>
          <span class="sms-push-tag">Demo Fallback</span>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    banner.querySelector('#close-sms-push')?.addEventListener('click', () => {
      banner.classList.add('animate-slide-up-out');
      setTimeout(() => banner.remove(), 300);
    });

    banner.querySelector('#sms-copy-otp-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(otp);
      const btn = banner.querySelector('#sms-copy-otp-btn');
      if (btn) btn.textContent = '✅ Copied!';
    });

    setTimeout(() => {
      if (document.body.contains(banner)) {
        banner.classList.add('animate-slide-up-out');
        setTimeout(() => banner.remove(), 300);
      }
    }, 20000);
  }

  /**
   * Wrap a transaction in a UserOperation and sponsor gas
   * PRODUCTION: Replace with Biconomy's SmartAccount.buildUserOp()
   */
  static async sendGaslessTransaction(txData) {
    if (!this._state.isAuthenticated && !this._state.currentAccount) {
      // Auto-create demo account if none exists
      this._state.currentAccount = this._generateSmartAccount('demo');
      this._state.isAuthenticated = true;
      this._saveState();
    }

    const txType = txData.type || 'registerProduct';
    const gasEstimate = GAS_COST_ESTIMATES[txType] || GAS_COST_ESTIMATES.registerProduct;

    // Build UserOperation
    const userOp = {
      sender: this._state.currentAccount.address,
      nonce: this._state.currentAccount.nonce++,
      callData: JSON.stringify(txData),
      callGasLimit: gasEstimate.gas,
      verificationGasLimit: 50000,
      preVerificationGas: 21000,
      maxFeePerGas: '0x' + (2e9).toString(16), // 2 Gwei
      maxPriorityFeePerGas: '0x' + (1e9).toString(16), // 1 Gwei
      paymasterAndData: '0x' + this._state.paymaster.address.slice(2), // Paymaster signs
      signature: '0x' + this._generateHex(130), // ERC-4337 signature
    };

    // Simulate Paymaster signing
    const paymasterSignature = await this._paymasterSign(userOp);

    // Track gas savings
    this._state.totalGasSaved += gasEstimate.costInr;
    this._state.totalTransactions++;
    this._state.transactionHistory.push({
      userOpHash: '0x' + this._generateHex(64),
      txType,
      gasSponsored: gasEstimate.gas,
      costSaved: gasEstimate.costInr,
      costSavedEth: gasEstimate.costEth,
      timestamp: Date.now(),
      status: 'confirmed',
    });

    this._saveState();

    return {
      success: true,
      userOpHash: userOp.signature.slice(0, 22) + '...',
      gasSponsored: gasEstimate.gas,
      costSaved: gasEstimate.costInr,
      costSavedEth: gasEstimate.costEth,
      paymasterSignature: paymasterSignature.slice(0, 20) + '...',
      pipeline: [
        { step: 'UserOp Created', status: 'done', icon: '📝' },
        { step: 'Paymaster Signed', status: 'done', icon: '💳' },
        { step: 'Bundler Submitted', status: 'done', icon: '📡' },
        { step: 'On-Chain Confirmed', status: 'done', icon: '⛓️' },
      ],
    };
  }

  /**
   * Get cumulative gas savings
   */
  static getGasSavings() {
    this._loadState();
    return {
      totalSavedInr: this._state.totalGasSaved,
      totalSavedEth: (this._state.totalGasSaved / 86000).toFixed(6), // Approximate ETH/INR
      totalTransactions: this._state.totalTransactions,
      history: this._state.transactionHistory.slice(-10),
    };
  }

  /**
   * Get current smart account info
   */
  static getAccount() {
    this._loadState();
    return this._state.currentAccount;
  }

  /**
   * Check if user has a gasless session
   */
  static isAuthenticated() {
    this._loadState();
    return this._state.isAuthenticated;
  }

  /**
   * Get the paymaster info
   */
  static getPaymasterInfo() {
    this._loadState();
    return {
      address: this._state.paymaster.address,
      name: 'FarmChain Paymaster',
      sponsored: this._state.totalTransactions,
      totalSaved: `₹${this._state.totalGasSaved}`,
      erc4337: true,
      // PRODUCTION: These would come from Biconomy Dashboard
      entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      bundlerUrl: 'https://bundler.biconomy.io/api/v2/80001/...',
    };
  }

  /**
   * Reset gasless state
   */
  static reset() {
    localStorage.removeItem(GASLESS_STATE_KEY);
    this._state = null;
  }

  // ==========================================
  // Internal helpers
  // ==========================================

  static _generateSmartAccount(seed) {
    // PRODUCTION: Replace with SimpleAccountFactory.createAccount()
    return {
      address: '0x' + this._generateHex(40),
      type: 'ERC-4337 Smart Account',
      factory: '0x' + this._generateHex(40),
      nonce: 0,
      createdAt: Date.now(),
      loginMethod: typeof seed === 'string' && seed.match(/^\d{10}$/) ? 'Phone OTP' : 'Social Login',
      phoneNumber: seed,
    };
  }

  static async _paymasterSign(userOp) {
    // PRODUCTION: Replace with Biconomy Paymaster API
    // POST https://paymaster.biconomy.io/api/v1/80001/{apiKey}
    // Body: { method: "pm_sponsorUserOperation", params: [userOp, entryPoint] }
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    return '0x' + this._generateHex(130);
  }

  static _generateHex(length) {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  static _loadState() {
    if (this._state) return;
    try {
      const saved = localStorage.getItem(GASLESS_STATE_KEY);
      if (saved) {
        this._state = JSON.parse(saved);
        return;
      }
    } catch (e) {
      // Fall through to default
    }

    this._state = {
      isAuthenticated: false,
      currentAccount: null,
      pendingAuth: null,
      paymaster: {
        address: '0x' + this._generateHex(40),
        name: 'FarmChain Paymaster v1',
      },
      totalGasSaved: 0,
      totalTransactions: 0,
      transactionHistory: [],
    };
  }

  static _saveState() {
    try {
      localStorage.setItem(GASLESS_STATE_KEY, JSON.stringify(this._state));
    } catch (e) {
      console.warn('Failed to save gasless state:', e);
    }
  }
}
