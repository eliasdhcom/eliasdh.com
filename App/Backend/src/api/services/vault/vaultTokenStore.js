/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const crypto = require('crypto');

const TTL_MS = 5 * 60 * 1000;
const store  = new Map();

function issue(userId) {
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + TTL_MS;
    store.set(token, { userId, expiresAt });
    return { token, expiresAt };
}

function check(token, userId) {
    if (!token) return false;
    const entry = store.get(token);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
        store.delete(token);
        return false;
    }
    return entry.userId === userId;
}

function revokeForUser(userId) {
    for (const [token, entry] of store) {
        if (entry.userId === userId) store.delete(token);
    }
}

setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of store) {
        if (now > entry.expiresAt) store.delete(token);
    }
}, 60 * 1000).unref();

module.exports = { issue, check, revokeForUser };