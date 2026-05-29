/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDb }          = require('../../../database/db');
const { server: config } = require('../../../config/env');
const logger             = require('../../../utils/logger');

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

module.exports = { login, verifyToken };