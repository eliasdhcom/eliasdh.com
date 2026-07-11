/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { getDb } = require('../../../database/db');
const logger    = require('../../../utils/logger');

const STATUS_COLUMNS = 'customer_id, subscription_id, period_start, invoice_type, paid, paid_at, amount, frequency, subscription_name, subscription_type, subscription_url';

function mapStatusRow(r) {
    return {
        customerId:       r.customer_id,
        subscriptionId:   r.subscription_id,
        periodStart:      r.period_start,
        invoiceType:      r.invoice_type,
        paid:             r.paid === 1 || r.paid === 1n,
        paidAt:           r.paid_at,
        amount:           r.amount    != null ? Number(r.amount) : null,
        frequency:        r.frequency        ?? null,
        subscriptionName: r.subscription_name ?? null,
        subscriptionType: r.subscription_type ?? null,
        subscriptionUrl:  r.subscription_url  ?? null
    };
}

async function getAllStatuses() {
    const { rows } = await getDb().execute(`SELECT ${STATUS_COLUMNS} FROM invoice_status`);
    return rows.map(mapStatusRow);
}

async function upsertStatus({ customerId, subscriptionId, periodStart, invoiceType, paid, amount, frequency, subscriptionName, subscriptionType, subscriptionUrl }) {
    logger.info(`Invoice status update: ${customerId}/${subscriptionId}/${periodStart}/${invoiceType} → paid=${paid}`);
    const paidAt = paid ? new Date().toISOString() : null;
    await getDb().execute({
        sql: `INSERT INTO invoice_status (customer_id, subscription_id, period_start, invoice_type, paid, paid_at, amount, frequency, subscription_name, subscription_type, subscription_url)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(customer_id, subscription_id, period_start, invoice_type) DO UPDATE SET
                  paid              = excluded.paid,
                  paid_at           = CASE WHEN excluded.paid = 1 AND invoice_status.paid = 0 THEN excluded.paid_at
                                          WHEN excluded.paid = 0 THEN NULL
                                          ELSE invoice_status.paid_at END,
                  amount            = CASE WHEN excluded.amount            IS NOT NULL THEN excluded.amount            ELSE invoice_status.amount            END,
                  frequency         = CASE WHEN excluded.frequency         IS NOT NULL THEN excluded.frequency         ELSE invoice_status.frequency         END,
                  subscription_name = CASE WHEN excluded.subscription_name IS NOT NULL THEN excluded.subscription_name ELSE invoice_status.subscription_name END,
                  subscription_type = CASE WHEN excluded.subscription_type IS NOT NULL THEN excluded.subscription_type ELSE invoice_status.subscription_type END,
                  subscription_url  = CASE WHEN excluded.subscription_url  IS NOT NULL THEN excluded.subscription_url  ELSE invoice_status.subscription_url  END`,
        args: [customerId, subscriptionId, periodStart, invoiceType, paid ? 1 : 0, paidAt, amount ?? null, frequency ?? null, subscriptionName ?? null, subscriptionType ?? null, subscriptionUrl ?? null]
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