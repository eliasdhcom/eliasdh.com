/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

async function getAllStatuses() {
    const { rows } = await getDb().execute(
        'SELECT customer_id, subscription_id, period_start, invoice_type, paid, paid_at, amount, frequency FROM invoice_status'
    );
    return rows.map(r => ({
        customerId:     r.customer_id,
        subscriptionId: r.subscription_id,
        periodStart:    r.period_start,
        invoiceType:    r.invoice_type,
        paid:           r.paid === 1 || r.paid === 1n,
        paidAt:         r.paid_at,
        amount:         r.amount    != null ? Number(r.amount) : null,
        frequency:      r.frequency ?? null
    }));
}

async function upsertStatus({ customerId, subscriptionId, periodStart, invoiceType, paid, amount }) {
    logger.info(`Invoice status update: ${customerId}/${subscriptionId}/${periodStart}/${invoiceType} → paid=${paid}`);
    const paidAt = paid ? new Date().toISOString() : null;
    await getDb().execute({
        sql: `INSERT INTO invoice_status (customer_id, subscription_id, period_start, invoice_type, paid, paid_at, amount)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(customer_id, subscription_id, period_start, invoice_type) DO UPDATE SET
                  paid   = excluded.paid,
                  paid_at = excluded.paid_at,
                  amount  = CASE WHEN excluded.amount IS NOT NULL THEN excluded.amount ELSE invoice_status.amount END`,
        args: [customerId, subscriptionId, periodStart, invoiceType, paid ? 1 : 0, paidAt, amount ?? null]
    });
}

async function snapshotPastPeriods(snapshots) {
    if (!snapshots.length) return;
    const db = getDb();
    for (const { customerId, subscriptionId, periodStart, invoiceType, amount, frequency } of snapshots) {
        await db.execute({
            sql: `INSERT INTO invoice_status (customer_id, subscription_id, period_start, invoice_type, paid, amount, frequency)
                  VALUES (?, ?, ?, ?, 0, ?, ?)
                  ON CONFLICT(customer_id, subscription_id, period_start, invoice_type) DO UPDATE SET
                      amount    = CASE WHEN invoice_status.amount IS NULL THEN excluded.amount ELSE invoice_status.amount END,
                      frequency = CASE WHEN invoice_status.frequency IS NULL THEN excluded.frequency ELSE invoice_status.frequency END`,
            args: [customerId, subscriptionId, periodStart, invoiceType, amount, frequency ?? null]
        });
    }
    logger.info(`Snapshotted ${snapshots.length} past invoice periods`);
}

module.exports = { getAllStatuses, upsertStatus, snapshotPastPeriods };
