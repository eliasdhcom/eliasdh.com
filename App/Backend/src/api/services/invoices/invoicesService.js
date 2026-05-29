/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

async function getAllStatuses() {
    const { rows } = await getDb().execute(
        'SELECT customer_id, subscription_id, period_start, invoice_type, paid, paid_at FROM invoice_status'
    );
    return rows.map(r => ({
        customerId:     r.customer_id,
        subscriptionId: r.subscription_id,
        periodStart:    r.period_start,
        invoiceType:    r.invoice_type,
        paid:           r.paid === 1 || r.paid === 1n,
        paidAt:         r.paid_at
    }));
}

async function upsertStatus({ customerId, subscriptionId, periodStart, invoiceType, paid }) {
    logger.info(`Invoice status update: ${customerId}/${subscriptionId}/${periodStart}/${invoiceType} → paid=${paid}`);
    const paidAt = paid ? new Date().toISOString() : null;
    await getDb().execute({
        sql: `INSERT INTO invoice_status (customer_id, subscription_id, period_start, invoice_type, paid, paid_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(customer_id, subscription_id, period_start, invoice_type) DO UPDATE SET paid = excluded.paid, paid_at = excluded.paid_at`,
        args: [customerId, subscriptionId, periodStart, invoiceType, paid ? 1 : 0, paidAt]
    });
}

module.exports = { getAllStatuses, upsertStatus };