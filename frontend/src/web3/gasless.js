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
   * Login with phone number — Real Firebase Phone Auth with SMS OTP
   * Sends a REAL SMS to the user's mobile phone via Firebase Authentication.
   * OTP is NEVER generated, displayed, logged, or returned by the app.
   */
  static async loginWithPhone(phoneNumber) {
    const { sendPhoneOtp, getFriendlyAuthErrorMessage, normalizeIndianPhone } = await import('../firebase/auth.js');

    const e164Phone = normalizeIndianPhone(phoneNumber);
    if (!e164Phone) {
      throw new Error('Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
    }

    try {
      this.init();
      console.log(`📱 Initiating Firebase SMS dispatch to ${e164Phone}...`);
      const result = await sendPhoneOtp(e164Phone, 'recaptcha-container');

      this._confirmationResult = result.confirmationResult;
      this._state.pendingAuth = {
        phone: result.phone,
        createdAt: Date.now(),
      };
      this._saveState();

      console.log(`✅ Firebase SMS request accepted for ${e164Phone}`);
      return {
        success: true,
        phone: result.phone,
      };
    } catch (err) {
      console.warn('Firebase Phone Auth error:', err);
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      const friendlyErr = new Error(friendlyMessage);
      friendlyErr.code = err.code;
      throw friendlyErr;
    }
  }

  /**
   * Verify OTP received on physical mobile phone via Firebase Authentication
   * and link to ERC-4337 smart account.
   */
  static async verifyOtpAndCreateAccount(phoneNumber, inputOtp) {
    if (!this._confirmationResult) {
      throw new Error('No pending authentication session. Please request a new OTP.');
    }

    const { verifyPhoneOtp, getFriendlyAuthErrorMessage } = await import('../firebase/auth.js');

    try {
      const verifyResult = await verifyPhoneOtp(this._confirmationResult, inputOtp);
      const firebaseUser = verifyResult.firebaseUser;
      const idToken = verifyResult.idToken;

      console.log('✅ Firebase Phone Auth verified successfully for UID:', firebaseUser.uid);

      // Create smart account representation linked to Firebase UID
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
        idToken,
        message: 'Phone verified via Firebase SMS — Smart wallet active!',
      };
    } catch (err) {
      console.warn('Firebase Phone OTP verification error:', err);
      const friendlyMessage = getFriendlyAuthErrorMessage(err);
      const friendlyErr = new Error(friendlyMessage);
      friendlyErr.code = err.code;
      throw friendlyErr;
    }
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
