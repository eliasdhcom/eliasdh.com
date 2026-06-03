/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

const MAX_RECORDS = Number(process.env.MAX_LOG_RECORDS ?? 500);

async function addLog({ userId, userEmail, userName, action, resource, resourceId, details, ipAddress } = {}) {
    const db = getDb();
    try {
        await db.execute({
            sql:  `INSERT INTO logs (user_id, user_email, user_name, action, resource, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                userId     ?? null,
                userEmail  ?? null,
                userName   ?? null,
                action,
                resource   ?? null,
                resourceId != null ? String(resourceId) : null,
                details    != null ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null,
                ipAddress  ?? null
            ]
        });
        await db.execute({
            sql:  `DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT ?)`,
            args: [MAX_RECORDS]
        });
    } catch (err) {
        logger.error(`[logs] Failed to write log entry: ${err.message}`);
    }
}

async function getLogs({ action, resource, userId, search, dateFrom, dateTo, limit = 100, offset = 0 } = {}) {
    const db         = getDb();
    const conditions = [];
    const args       = [];

    if (action)   { conditions.push(`action = ?`);    args.push(action); }
    if (resource)  { conditions.push(`resource = ?`);  args.push(resource); }
    if (userId)   { conditions.push(`user_id = ?`);   args.push(Number(userId)); }
    if (dateFrom) { conditions.push(`created_at >= ?`); args.push(dateFrom); }
    if (dateTo)   { conditions.push(`created_at <= ?`); args.push(dateTo + 'T23:59:59'); }
    if (search) {
        const s = `%${search}%`;
        conditions.push(`(user_email LIKE ? OR user_name LIKE ? OR details LIKE ? OR resource_id LIKE ? OR resource LIKE ?)`);
        args.push(s, s, s, s, s);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.execute({
        sql:  `SELECT * FROM logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        args: [...args, Number(limit), Number(offset)]
    });

    const { rows: cnt } = await db.execute({
        sql:  `SELECT COUNT(*) AS n FROM logs ${where}`,
        args
    });

    return { data: rows.map(mapLog), total: Number(cnt[0].n) };
}

function mapLog(row) {
    return {
        id:         Number(row.id),
        userId:     row.user_id    ? Number(row.user_id) : null,
        userEmail:  row.user_email ?? null,
        userName:   row.user_name  ?? null,
        action:     row.action,
        resource:   row.resource    ?? null,
        resourceId: row.resource_id ?? null,
        details:    row.details     ?? null,
        ipAddress:  row.ip_address  ?? null,
        createdAt:  row.created_at
    };
}

async function clearLogs() {
    const db = getDb();
    await db.execute({ sql: `DELETE FROM logs`, args: [] });
}

module.exports = { addLog, getLogs, clearLogs };