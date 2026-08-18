import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'PARIKSHATANTRA_ULTRA_SECURE_JWT_SECRET_2026_PROD_GRADE',
  AES_MASTER_KEY: process.env.AES_MASTER_KEY || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90', // 64 hex chars (32 bytes)
  HMAC_ACTIVATION_KEY: process.env.HMAC_ACTIVATION_KEY || 'PARIKSHATANTRA_HMAC_ACTIVATION_SECRET_KEY_998877665544332211',
  TOKEN_EXPIRY: '8h',
  ACTIVATION_TOKEN_EXPIRY_MINUTES: 15,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

export function validateSecrets(): void {
  console.log('🔒 Secret Hygiene: Verifying system cryptographic keys and API configuration...');
  if (!CONFIG.JWT_SECRET || CONFIG.JWT_SECRET.length < 16) {
    console.warn('⚠️ WARNING: JWT_SECRET is weakly configured or using default template.');
  }
  if (!CONFIG.AES_MASTER_KEY || CONFIG.AES_MASTER_KEY.length < 64) {
    console.warn('⚠️ WARNING: AES_MASTER_KEY must be a 64-character hex string (32 bytes).');
  }
  if (CONFIG.GEMINI_API_KEY) {
    console.log('✅ Gemini AI Backend Key Active (backend-isolated).');
  } else {
    console.log('ℹ️ Gemini AI Key omitted: AI engines operating in deterministic rule fallback mode.');
  }
}



