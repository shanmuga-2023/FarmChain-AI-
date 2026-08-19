// ============================================
// FarmChain AI — Blockchain Core Engine
// SHA-256 based simulated blockchain
// ============================================

export class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = '';
  }

  async calculateHash() {
    const content = this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce;
    const msgBuffer = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async mineBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = await this.calculateHash();
    }
    return this.hash;
  }
}

export class Blockchain {
  constructor() {
    this.chain = [];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.listeners = new Map();
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;

    // Try to restore from localStorage
    const saved = localStorage.getItem('farmchain_blockchain');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.chain = parsed.chain || [];
        this._initialized = true;
        return;
      } catch (e) {
        console.warn('Failed to restore blockchain, creating new one');
      }
    }

    // Create genesis block
    const genesisBlock = new Block(0, Date.now(), {
      type: 'GENESIS',
      message: 'FarmChain AI Genesis Block — Empowering Transparent Agriculture',
      version: '1.0.0',
    }, '0');
    genesisBlock.hash = await genesisBlock.calculateHash();
    this.chain = [genesisBlock];
    this._initialized = true;
    this._save();
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(data) {
    const previousBlock = this.getLatestBlock();
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      data,
      previousBlock.hash
    );
    await newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    this._save();
    this._emit('blockAdded', newBlock);
    return newBlock;
  }

  async addTransaction(transaction) {
    const txData = {
      ...transaction,
      txId: this._generateTxId(),
      timestamp: Date.now(),
    };

    const block = await this.addBlock(txData);
    this._emit('transactionAdded', { transaction: txData, block });
    return { transaction: txData, block };
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.hash) {
        return false;
      }
    }
    return true;
  }

  getTransactionsByType(type) {
    return this.chain
      .filter(block => block.data && block.data.type === type)
      .map(block => ({
        ...block.data,
        blockIndex: block.index,
        blockHash: block.hash,
        blockTimestamp: block.timestamp,
      }));
  }

  getTransactionsByEntity(entityId) {
    return this.chain
      .filter(block => {
        const d = block.data;
        return d && (d.farmerId === entityId || d.buyerId === entityId ||
          d.sellerId === entityId || d.ownerId === entityId ||
          d.from === entityId || d.to === entityId);
      })
      .map(block => ({
        ...block.data,
        blockIndex: block.index,
        blockHash: block.hash,
        blockTimestamp: block.timestamp,
      }));
  }

  getProductHistory(productId) {
    return this.chain
      .filter(block => block.data && block.data.productId === productId)
      .map(block => ({
        ...block.data,
        blockIndex: block.index,
        blockHash: block.hash,
        blockTimestamp: block.timestamp,
      }))
      .sort((a, b) => a.blockTimestamp - b.blockTimestamp);
  }

  getAllTransactions() {
    return this.chain
      .filter(block => block.data && block.data.type !== 'GENESIS')
      .map(block => ({
        ...block.data,
        blockIndex: block.index,
        blockHash: block.hash,
        blockTimestamp: block.timestamp,
      }));
  }

  getBlock(index) {
    return this.chain[index] || null;
  }

  getBlockCount() {
    return this.chain.length;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  _emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }

  _generateTxId() {
    const chars = 'abcdef0123456789';
    let result = '0x';
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  _save() {
    try {
      localStorage.setItem('farmchain_blockchain', JSON.stringify({
        chain: this.chain,
      }));
    } catch (e) {
      console.warn('Failed to save blockchain to localStorage');
    }
  }

  reset() {
    localStorage.removeItem('farmchain_blockchain');
    this.chain = [];
    this._initialized = false;
  }
}

// Singleton instance
export const blockchain = new Blockchain();
