/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const crypto = require('crypto');
const { server: config } = require('../config/env');
const logger = require('./logger');

const ALGO      = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_BYTES = 32;

function loadKey() {
    const raw = config.vaultEncryptionKey;
    if (!raw) {
        logger.error('VAULT_ENCRYPTION_KEY is not set. Refusing to start.');
        throw new Error('VAULT_ENCRYPTION_KEY is not set.');
    }
    const key = Buffer.from(raw, 'hex');
    if (key.length !== KEY_BYTES) {
        logger.error(`VAULT_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex chars).`);
        throw new Error('VAULT_ENCRYPTION_KEY has invalid length.');
    }
    return key;
}

const KEY = loadKey();

function encrypt(plaintext) {
    const iv     = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

function decrypt(payload) {
    const [ivB64, tagB64, dataB64] = String(payload).split(':');
    const iv         = Buffer.from(ivB64, 'base64');
    const authTag    = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(dataB64, 'base64');
    const decipher   = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };