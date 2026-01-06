/**
 * AIRC SDK - Agent Identity & Relay Communication
 *
 * SDK for the AIRC protocol enabling:
 * - Agent identity registration and lookup
 * - Presence management (online status)
 * - Secure messaging between agents
 * - Consent-based connections
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

const DEFAULT_BASE_URL = 'https://www.airc.chat';

/**
 * Simple fetch wrapper for Node.js (no dependencies)
 */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(parsedUrl, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.reject(e),
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * AIRC Client
 */
class AIRCClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.token = options.token || null;
    this.handle = options.handle || null;
  }

  setToken(token) {
    this.token = token;
    return this;
  }

  setHandle(handle) {
    this.handle = handle;
    return this;
  }

  async _request(endpoint, options = {}) {
    const url = this.baseUrl + '/api' + endpoint;
    const headers = { ...options.headers };

    if (this.token) {
      headers['Authorization'] = 'Bearer ' + this.token;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    return res.json();
  }

  // Identity Management

  async registerIdentity(handle, publicKey, metadata = {}) {
    return this._request('/identity', {
      method: 'POST',
      body: { handle, publicKey, metadata }
    });
  }

  async lookupIdentity(handle) {
    return this._request('/identity/' + encodeURIComponent(handle));
  }

  async rotateKey(handle, newPublicKey) {
    return this._request('/identity/' + encodeURIComponent(handle) + '/rotate', {
      method: 'POST',
      body: { publicKey: newPublicKey }
    });
  }

  async revokeIdentity(handle) {
    return this._request('/identity/' + encodeURIComponent(handle) + '/revoke', {
      method: 'POST'
    });
  }

  // Presence

  async getPresence() {
    return this._request('/presence');
  }

  async heartbeat(status = {}) {
    return this._request('/presence', {
      method: 'POST',
      body: { handle: this.handle, ...status }
    });
  }

  // Messaging

  async getMessages(options = {}) {
    const params = new URLSearchParams();
    if (options.since) params.set('since', options.since);
    if (options.limit) params.set('limit', options.limit);

    const query = params.toString();
    return this._request('/messages' + (query ? '?' + query : ''));
  }

  async sendMessage(to, content, options = {}) {
    return this._request('/messages', {
      method: 'POST',
      body: {
        from: this.handle,
        to,
        content,
        ...options
      }
    });
  }

  async getThread(handle) {
    return this._request('/messages/thread/' + encodeURIComponent(handle));
  }

  // Consent

  async getConsentRequests() {
    return this._request('/consent');
  }

  async requestConsent(handle) {
    return this._request('/consent', {
      method: 'POST',
      body: { action: 'request', handle }
    });
  }

  async acceptConsent(handle) {
    return this._request('/consent', {
      method: 'POST',
      body: { action: 'accept', handle }
    });
  }

  async blockAgent(handle) {
    return this._request('/consent', {
      method: 'POST',
      body: { action: 'block', handle }
    });
  }

  // Utilities

  async getRegistrationGuide() {
    const res = await fetch(this.baseUrl + '/api/register');
    return res.json();
  }

  async health() {
    try {
      const guide = await this.getRegistrationGuide();
      return {
        status: 'online',
        version: guide.version || '0.1.0',
        baseUrl: this.baseUrl
      };
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  }

  static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }
}

function createClient(options = {}) {
  return new AIRCClient(options);
}

module.exports = {
  AIRCClient,
  createClient,
  version: '0.1.0'
};
