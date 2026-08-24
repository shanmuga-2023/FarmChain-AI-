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

  /**
   * Initialize gasless provider
   */
  static init() {
    this._loadState();
  }

  /**
   * Login with phone number (Real SMS / OS Notification & Floating Banner)
   * PRODUCTION: Replace with Web3Auth or Biconomy Social Login SDK
   */
  static async loginWithPhone(phoneNumber) {
    let otp = null;

    // Try backend SMS gateway endpoint first
    try {
      const response = await fetch('http://localhost:4000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.otp) otp = data.otp;
      }
    } catch (e) {
      console.log('Backend SMS gateway offline, using client-side generator');
    }

    if (!otp) {
      otp = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store pending auth
    this._state.pendingAuth = {
      phone: phoneNumber,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000, // 5 minutes
    };
    this._saveState();

    console.log(`📱 Gasless Auth: OTP ${otp} dispatched to ${phoneNumber}`);

    // Trigger realistic Mobile SMS sound, vibration, and OS/In-App incoming SMS banner
    this.triggerMobileSmsArrival(phoneNumber, otp);

    return { otp, expiresIn: 300 };
  }

  /**
   * Plays a realistic mobile SMS chime and displays an interactive incoming SMS banner
   */
  static triggerMobileSmsArrival(phone, otp) {
    // 1. Play realistic SMS chime via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (err) {
      // Audio context might be restricted before user gesture
    }

    // 2. Trigger mobile device vibration if available
    if (navigator.vibrate) {
      try {
        navigator.vibrate([120, 80, 120]);
      } catch (e) {}
    }

    // 3. Trigger native OS / Mobile system notification if permitted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification('💬 Messages • FarmChain Security', {
            body: `Your FarmChain AI smart wallet verification code is ${otp}. Valid for 5 minutes.`,
            icon: '🌾',
          });
        } catch (e) {}
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            try {
              new Notification('💬 Messages • FarmChain Security', {
                body: `Your FarmChain AI smart wallet verification code is ${otp}. Valid for 5 minutes.`,
                icon: '🌾',
              });
            } catch (e) {}
          }
        });
      }
    }

    // 4. Render floating Smartphone Lockscreen / Push SMS Banner
    this._renderIncomingSmsBanner(phone, otp);
  }

  /**
   * Render high-fidelity iOS/Android incoming SMS banner
   */
  static _renderIncomingSmsBanner(phone, otp) {
    // Remove existing banner if any
    const existing = document.getElementById('floating-mobile-sms-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'floating-mobile-sms-banner';
    banner.className = 'mobile-sms-push-banner animate-slide-down';
    banner.innerHTML = `
      <div class="sms-push-inner">
        <div class="sms-push-header">
          <div class="sms-push-app">
            <span class="sms-push-icon">💬</span>
            <span class="sms-push-appname">MESSAGES</span>
            <span class="sms-push-bullet">•</span>
            <span class="sms-push-time">Just now</span>
          </div>
          <button class="sms-push-close" id="close-sms-push">✕</button>
        </div>
        <div class="sms-push-content">
          <div class="sms-push-sender">FarmChain AI Security</div>
          <div class="sms-push-body">
            Your smart wallet verification code is <strong class="sms-highlight-code">${otp}</strong>. Enter this code on the screen to verify your phone.
          </div>
        </div>
        <div class="sms-push-actions">
          <button type="button" class="sms-copy-btn" id="sms-copy-otp-btn">
            📋 Copy ${otp}
          </button>
          <span class="sms-push-tag">ERC-4337 Smart Account</span>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Event listeners
    banner.querySelector('#close-sms-push')?.addEventListener('click', () => {
      banner.classList.add('animate-slide-up-out');
      setTimeout(() => banner.remove(), 300);
    });

    banner.querySelector('#sms-copy-otp-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(otp);
      const btn = banner.querySelector('#sms-copy-otp-btn');
      if (btn) btn.textContent = '✅ Copied!';
      
      // Auto-fill individual digit inputs if present
      const digitInputs = document.querySelectorAll('.otp-digit-input');
      if (digitInputs.length === 6) {
        otp.split('').forEach((d, i) => {
          if (digitInputs[i]) digitInputs[i].value = d;
        });
        digitInputs[5].focus();
      }
    });

    // Auto dismiss after 15 seconds
    setTimeout(() => {
      if (document.body.contains(banner)) {
        banner.classList.add('animate-slide-up-out');
        setTimeout(() => banner.remove(), 300);
      }
    }, 15000);
  }

  /**
   * Verify OTP and create smart account
   * PRODUCTION: Replace with Web3Auth verifier + Account Factory
   */
  static async verifyOtpAndCreateAccount(phoneNumber, inputOtp) {
    const pending = this._state.pendingAuth;

    if (!pending || pending.phone.replace(/\s+/g, '') !== phoneNumber.replace(/\s+/g, '')) {
      throw new Error('No pending authentication for this number');
    }

    if (Date.now() > pending.expiresAt) {
      throw new Error('OTP expired. Please request a new one.');
    }

    if (pending.otp !== inputOtp.trim()) {
      throw new Error('Invalid OTP. Please check the code on your notification and try again.');
    }

    // Dismiss floating SMS banner on successful verification
    const banner = document.getElementById('floating-mobile-sms-banner');
    if (banner) banner.remove();

    // PRODUCTION: This is where Web3Auth would create a non-custodial wallet
    // using the phone number as a factor in the key reconstruction
    const smartAccount = this._generateSmartAccount(phoneNumber);

    this._state.currentAccount = smartAccount;
    this._state.isAuthenticated = true;
    this._state.pendingAuth = null;
    this._saveState();

    return {
      success: true,
      account: smartAccount,
      message: '✅ Smart account created — no seed phrase needed!',
    };
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
