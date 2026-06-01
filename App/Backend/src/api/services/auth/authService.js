/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { getDb }      = require('../../../database/db');
const { server: config } = require('../../../config/env');
const logger         = require('../../../utils/logger');
const mailer         = require('../mailer/mailerService');

async function login(email, password) {
    const { rows } = await getDb().execute({
        sql:  'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
        args: [email.trim()]
    });

    if (!rows.length) return null;
    const user = rows[0];

    if (Number(user.active) === 0) return { blocked: true };

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    const payload = {
        id:        Number(user.id),
        email:     user.email,
        firstName: user.first_name,
        lastName:  user.last_name,
        role:      user.role,
        company:   user.company   ?? '',
        phone:     user.phone     ?? '',
        birthDate: user.birth_date ?? ''
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    logger.info(`User ${user.email} authenticated`);
    return { token, user: payload };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch {
        return null;
    }
}

async function forgotPassword(email) {
    const db = getDb();
    const { rows } = await db.execute({
        sql:  'SELECT id, first_name FROM users WHERE LOWER(email) = LOWER(?)',
        args: [email.trim()]
    });
    if (!rows.length) return true;

    const user   = rows[0];
    const code   = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.execute({
        sql:  'UPDATE password_reset_tokens SET used = 1 WHERE LOWER(email) = LOWER(?) AND used = 0',
        args: [email.trim()]
    });
    await db.execute({
        sql:  'INSERT INTO password_reset_tokens (user_id, email, code, expires_at) VALUES (?, LOWER(?), ?, ?)',
        args: [Number(user.id), email.trim(), code, expiry]
    });

    const body = `
        <h2 style="margin:0 0 8px;font-size:22px;color:#4f94f0;font-weight:700;">Wachtwoord resetten</h2>
        <p style="font-size:15px;color:#555;margin:0 0 24px;line-height:1.6;">Hallo <strong style="color:#1a1a1a;">${user.first_name}</strong>,</p>
        <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">Gebruik de onderstaande code om uw wachtwoord te resetten. De code is <strong style="color:#4f94f0;">15 minuten</strong> geldig.</p>
        <div style="text-align:center;margin:0 0 32px;">
            <div style="display:inline-block;background:#eef4ff;border:2px solid #4f94f0;border-radius:12px;padding:18px 36px;">
                <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#4f94f0;font-variant-numeric:tabular-nums;">${code}</span>
            </div>
        </div>
        <p style="font-size:13px;color:#999;margin:0;line-height:1.5;">Als u dit niet heeft aangevraagd, kunt u deze e-mail negeren. De code vervalt automatisch.</p>
    `;

    await mailer.send({
        to:      email.trim(),
        subject: 'Reset uw wachtwoord — EliasDH',
        html:    mailer.layout({ headerTitle: 'Wachtwoord reset', body })
    });

    logger.info(`Password reset code sent to ${email}`);
    return true;
}

async function verifyResetCode(email, code) {
    const { rows } = await getDb().execute({
        sql:  'SELECT expires_at FROM password_reset_tokens WHERE LOWER(email) = LOWER(?) AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1',
        args: [email.trim(), code]
    });
    if (!rows.length) return false;
    return new Date(rows[0].expires_at) > new Date();
}

async function resetPassword(email, code, newPassword) {
    const valid = await verifyResetCode(email, code);
    if (!valid) return false;

    const db   = getDb();
    const hash = await bcrypt.hash(newPassword, 12);

    await db.execute({
        sql:  'UPDATE users SET password_hash = ? WHERE LOWER(email) = LOWER(?)',
        args: [hash, email.trim()]
    });
    await db.execute({
        sql:  'UPDATE password_reset_tokens SET used = 1 WHERE LOWER(email) = LOWER(?) AND code = ?',
        args: [email.trim(), code]
    });

    logger.info(`Password reset completed for ${email}`);
    return true;
}

module.exports = { login, verifyToken, forgotPassword, verifyResetCode, resetPassword };
