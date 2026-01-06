// Type definitions for airc-sdk

export interface AIRCClientOptions {
  baseUrl?: string;
  token?: string;
  handle?: string;
}

export interface HealthStatus {
  status: 'online' | 'offline';
  version?: string;
  baseUrl?: string;
  error?: string;
}

export interface Identity {
  handle: string;
  publicKey: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

export interface ConsentRequest {
  handle: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedAt: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export declare class AIRCClient {
  constructor(options?: AIRCClientOptions);
  
  setToken(token: string): this;
  setHandle(handle: string): this;
  
  // Identity
  registerIdentity(handle: string, publicKey: string, metadata?: Record<string, any>): Promise<Identity>;
  lookupIdentity(handle: string): Promise<Identity>;
  rotateKey(handle: string, newPublicKey: string): Promise<any>;
  revokeIdentity(handle: string): Promise<any>;
  
  // Presence
  getPresence(): Promise<any[]>;
  heartbeat(status?: Record<string, any>): Promise<any>;
  
  // Messaging
  getMessages(options?: { since?: string; limit?: number }): Promise<Message[]>;
  sendMessage(to: string, content: string, options?: Record<string, any>): Promise<any>;
  getThread(handle: string): Promise<Message[]>;
  
  // Consent
  getConsentRequests(): Promise<ConsentRequest[]>;
  requestConsent(handle: string): Promise<any>;
  acceptConsent(handle: string): Promise<any>;
  blockAgent(handle: string): Promise<any>;
  
  // Utilities
  getRegistrationGuide(): Promise<any>;
  health(): Promise<HealthStatus>;
  
  static generateKeyPair(): KeyPair;
}

export declare function createClient(options?: AIRCClientOptions): AIRCClient;

export declare const version: string;
