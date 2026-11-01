import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface Config {
  PORT: number;
  JWT_SECRET: string;
  AES_MASTER_KEY: string;
  HMAC_ACTIVATION_KEY: string;
  TOKEN_EXPIRY: string;
  ACTIVATION_TOKEN_EXPIRY_MINUTES: number;
  GEMINI_API_KEY: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireHex(name: string, expectedLength: number): string {
  const value = requireEnv(name);
  if (!/^[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`Environment variable ${name} must be a hex string`);
  }
  if (value.length !== expectedLength) {
    throw new Error(`Environment variable ${name} must be ${expectedLength} hex characters (${expectedLength / 2} bytes)`);
  }
  return value;
}

export const CONFIG: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  AES_MASTER_KEY: requireHex('AES_MASTER_KEY', 64),
  HMAC_ACTIVATION_KEY: requireEnv('HMAC_ACTIVATION_KEY'),
  TOKEN_EXPIRY: '8h',
  ACTIVATION_TOKEN_EXPIRY_MINUTES: 15,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

export function validateSecrets(): void {
  console.log('🔒 Secret Hygiene: Verifying system cryptographic keys and API configuration...');
  
  if (CONFIG.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for HS256');
  }
  
  if (CONFIG.AES_MASTER_KEY.length !== 64) {
    throw new Error('AES_MASTER_KEY must be exactly 64 hex characters (32 bytes)');
  }
  
  if (CONFIG.HMAC_ACTIVATION_KEY.length < 32) {
    throw new Error('HMAC_ACTIVATION_KEY must be at least 32 characters');
  }

  if (CONFIG.GEMINI_API_KEY) {
    console.log('✅ Gemini AI Backend Key Active (backend-isolated).');
  } else {
    console.log('ℹ️ Gemini AI Key omitted: AI engines operating in deterministic rule fallback mode.');
  }
  
  console.log('✅ All mandatory cryptographic secrets validated.');
}
