/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 07/07/2026
**/

const { getDb }  = require('../../../database/db');
const vaultCrypto = require('../../../utils/vaultCrypto');
const logger     = require('../../../utils/logger');

const BASE_SELECT = `
    SELECT p.*, u.first_name AS updated_by_first_name, u.last_name AS updated_by_last_name
    FROM password_entries p
    LEFT JOIN users u ON u.id = p.updated_by
`;

function mapEntry(r) {
    return {
        id:            Number(r.id),
        serviceName:   r.service_name,
        loginUrl:      r.login_url ?? '',
        email:         r.email ?? '',
        username:      r.username ?? '',
        has2fa:        Number(r.has_2fa) === 1,
        createdBy:     r.created_by,
        updatedBy:     r.updated_by,
        updatedByName: `${r.updated_by_first_name ?? ''} ${r.updated_by_last_name ?? ''}`.trim(),
        createdAt:     r.created_at,
        updatedAt:     r.updated_at,
        hasPassword:   !!r.password_enc
    };
}

async function getAll({ search } = {}) {
    const conditions = [];
    const args       = [];
    if (search) {
        conditions.push('p.service_name LIKE ?');
        args.push(`%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await getDb().execute({
        sql:  `${BASE_SELECT} ${where} ORDER BY p.service_name ASC`,
        args
    });
    return rows.map(mapEntry);
}

async function getById(id) {
    const { rows } = await getDb().execute({ sql: `${BASE_SELECT} WHERE p.id = ?`, args: [id] });
    return rows.length ? mapEntry(rows[0]) : null;
}

async function create(data, userId) {
    const db  = getDb();
    const enc = vaultCrypto.encrypt(data.password);
    const res = await db.execute({
        sql:  `INSERT INTO password_entries
               (service_name, login_url, email, username, password_enc, has_2fa, created_by, updated_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            data.serviceName,
            data.loginUrl ?? null,
            data.email    ?? null,
            data.username ?? null,
            enc,
            data.has2fa ? 1 : 0,
            userId,
            userId
        ]
    });
    const id = Number(res.lastInsertRowid);
    logger.info(`Password entry created: ${id}`);
    return getById(id);
}

async function update(id, data, userId) {
    const db     = getDb();
    const fields = ['updated_by = ?', "updated_at = datetime('now')"];
    const args   = [userId];

    if (data.serviceName !== undefined) { fields.push('service_name = ?'); args.push(data.serviceName); }
    if (data.loginUrl    !== undefined) { fields.push('login_url = ?');    args.push(data.loginUrl || null); }
    if (data.email       !== undefined) { fields.push('email = ?');        args.push(data.email || null); }
    if (data.username    !== undefined) { fields.push('username = ?');     args.push(data.username || null); }
    if (data.has2fa      !== undefined) { fields.push('has_2fa = ?');      args.push(data.has2fa ? 1 : 0); }
    if (data.password) {
        fields.push('password_enc = ?');
        args.push(vaultCrypto.encrypt(data.password));
    }

    args.push(id);
    await db.execute({ sql: `UPDATE password_entries SET ${fields.join(', ')} WHERE id = ?`, args });
    logger.info(`Password entry updated: ${id}`);
    return getById(id);
}

async function remove(id) {
    await getDb().execute({ sql: 'DELETE FROM password_entries WHERE id = ?', args: [id] });
    logger.info(`Password entry deleted: ${id}`);
}

async function revealPassword(id) {
    const { rows } = await getDb().execute({
        sql:  'SELECT password_enc FROM password_entries WHERE id = ?',
        args: [id]
    });
    if (!rows.length) return null;
    return vaultCrypto.decrypt(rows[0].password_enc);
}

module.exports = { getAll, getById, create, update, remove, revealPassword, mapEntry };