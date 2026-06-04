/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 04/06/2026
**/

const webPush = require('web-push');
const { getDb } = require('../../../database/db');
const logger   = require('../../../utils/logger');

let vapidReady = false;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || process.env.VAPID_EMAIL || 'mailto:info@eliasdh.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        vapidReady = true;
        logger.info(`Push: VAPID ready. Public key starts with: ${process.env.VAPID_PUBLIC_KEY.slice(0, 10)}...`);
    } catch (err) {
        logger.error(`Push: VAPID init failed — keys may be swapped: ${err.message}`);
    }
} else {
    logger.warn('Push: VAPID keys not set — push notifications disabled.');
}

async function saveSubscription(userId, subscription) {
    const db = getDb();
    const { endpoint, keys: { p256dh, auth } } = subscription;
    await db.execute({
        sql: `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth`,
        args: [userId, endpoint, p256dh, auth]
    });
    logger.info(`Push: subscription saved for user ${userId}. Endpoint: ${endpoint.slice(0, 40)}...`);
}

async function removeSubscription(endpoint) {
    const db = getDb();
    await db.execute({ sql: `DELETE FROM push_subscriptions WHERE endpoint = ?`, args: [endpoint] });
}

async function sendToAdmins(payload) {
    if (!vapidReady) { logger.warn('Push: sendToAdmins called but VAPID not ready.'); return; }
    const db = getDb();
    const { rows } = await db.execute({
        sql: `SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps JOIN users u ON u.id = ps.user_id WHERE u.role = 'admin' AND u.active = 1`,
        args: []
    });
    logger.info(`Push: sendToAdmins — ${rows.length} subscription(s) found.`);
    const message = JSON.stringify(payload);
    for (const row of rows) {
        try {
            await webPush.sendNotification(
                { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
                message
            );
            logger.info(`Push: sent to ${row.endpoint.slice(0, 40)}...`);
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                logger.info(`Push: subscription expired, removing ${row.endpoint.slice(0, 40)}...`);
                await removeSubscription(row.endpoint).catch(() => {});
            } else {
                logger.warn(`Push: send failed for ${row.endpoint.slice(0, 40)}... — ${err.statusCode ?? ''} ${err.message}`);
            }
        }
    }
}

module.exports = { saveSubscription, removeSubscription, sendToAdmins };
