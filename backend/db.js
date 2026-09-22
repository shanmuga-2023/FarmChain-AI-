// server/db.js
// Lightweight JSON file-based database for shared, cross-client persistent state

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data_store.json');

const defaultDbStructure = {
  users: {},
  products: [],
  orders: [],
  transfers: [],
  certificates: [],
  blocks: [],
  fraudAlerts: [],
};

class JSONDatabase {
  constructor() {
    this.data = { ...defaultDbStructure };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = { ...defaultDbStructure, ...JSON.parse(raw) };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load DB file, initializing default:', e);
      this.data = { ...defaultDbStructure };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write DB file:', e);
    }
  }

  get(collection) {
    return this.data[collection] || [];
  }

  set(collection, value) {
    this.data[collection] = value;
    this.save();
    return value;
  }

  addItem(collection, item) {
    if (!Array.isArray(this.data[collection])) {
      this.data[collection] = [];
    }
    this.data[collection].push(item);
    this.save();
    return item;
  }

  updateItem(collection, predicate, updates) {
    if (Array.isArray(this.data[collection])) {
      this.data[collection] = this.data[collection].map(item =>
        predicate(item) ? { ...item, ...updates } : item
      );
      this.save();
    }
  }

  findItem(collection, predicate) {
    if (Array.isArray(this.data[collection])) {
      return this.data[collection].find(predicate) || null;
    }
    return null;
  }

  removeItem(collection, predicate) {
    if (Array.isArray(this.data[collection])) {
      const before = this.data[collection].length;
      this.data[collection] = this.data[collection].filter(item => !predicate(item));
      this.save();
      return this.data[collection].length < before;
    }
    return false;
  }

  reset() {
    this.data = { ...defaultDbStructure };
    this.save();
  }
}

export const db = new JSONDatabase();
