/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/07/2026
**/

const dayjs  = require('dayjs');
const cron   = require('node-cron');
const { getDb } = require('../../../database/db');
const logger     = require('../../../utils/logger');
const metricsService = require('./metricsService');

const SAMPLE_INTERVAL_MINUTES = Number(process.env.TRAFFIC_SAMPLE_INTERVAL_MINUTES) || 15;
const RETENTION_DAYS = Number(process.env.TRAFFIC_RETENTION_DAYS) || 30;

const RANGE_TO_HOURS = { '24h': 24, '7d': 24 * 7, '30d': 24 * 30 };

async function runSample() {
    if (!metricsService.kubeEnabled) {
        logger.info('Traffic sampler: Kubernetes not available, skipping sample.');
        return;
    }

    const db = getDb();
    const { rows: websites } = await db.execute(`SELECT id, url FROM websites WHERE is_live = 1`);
    if (!websites.length) return;

    const sampleTime   = dayjs().toISOString();
    const sinceSeconds = SAMPLE_INTERVAL_MINUTES * 60;

    for (const website of websites) {
        try {
            const count = await metricsService.getRequestCountSince(website.url, sinceSeconds);
            await db.execute({
                sql:  `INSERT INTO website_traffic_samples (website_id, sample_time, request_count) VALUES (?, ?, ?)`,
                args: [website.id, sampleTime, count]
            });
        } catch (error) {
            logger.error(`Traffic sampler failed for website ${website.id}: ${error.message}`);
        }
    }

    try {
        const cutoff = dayjs().subtract(RETENTION_DAYS, 'day').toISOString();
        await db.execute({ sql: `DELETE FROM website_traffic_samples WHERE sample_time < ?`, args: [cutoff] });
    } catch (error) {
        logger.warn(`Traffic sampler prune failed: ${error.message}`);
    }
}

function rangeToSinceIso(range) {
    const hours = RANGE_TO_HOURS[range] ?? RANGE_TO_HOURS['7d'];
    return dayjs().subtract(hours, 'hour').toISOString();
}

async function getHistory(websiteId, range) {
    const sinceIso = rangeToSinceIso(range);
    const { rows }  = await getDb().execute({
        sql:  `SELECT sample_time, request_count FROM website_traffic_samples
               WHERE website_id = ? AND sample_time >= ?
               ORDER BY sample_time ASC`,
        args: [websiteId, sinceIso]
    });
    return rows.map(r => ({ t: r.sample_time, count: Number(r.request_count) }));
}

function startTrafficSampler() {
    cron.schedule(`*/${SAMPLE_INTERVAL_MINUTES} * * * *`, () => {
        runSample().catch(err => logger.error('Traffic sample run failed:', err.message));
    });
    logger.info(`Traffic sampler started (every ${SAMPLE_INTERVAL_MINUTES} minutes).`);
}

module.exports = { startTrafficSampler, runSample, getHistory, RANGE_TO_HOURS };