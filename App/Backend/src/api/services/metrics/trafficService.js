/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 15/07/2026
**/

const { getDb } = require('../../../database/db');

const BASE_DAILY_REQUESTS = 20;
const REQUESTS_PER_EURO   = 4;

const RAW_HOUR_WEIGHTS = [
    0.3, 0.2, 0.15, 0.15, 0.2, 0.3, 0.5, 0.8, 1.1, 1.4, 1.5, 1.5,
    1.4, 1.5, 1.5, 1.4, 1.3, 1.2, 1.0, 0.9, 0.8, 0.7, 0.5, 0.4
];
const HOUR_WEIGHT_SUM = RAW_HOUR_WEIGHTS.reduce((a, b) => a + b, 0);
const HOUR_WEIGHTS    = RAW_HOUR_WEIGHTS.map(w => (w / HOUR_WEIGHT_SUM) * 24);

function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function noiseFor(websiteId, bucketIso) {
    const rng = mulberry32(hashSeed(`${websiteId}:${bucketIso}`));
    return 0.75 + rng() * 0.5; // 0.75 - 1.25
}

function hourBuckets(count, now) {
    const end = new Date(now);
    end.setMinutes(0, 0, 0);
    const buckets = [];
    for (let i = count - 1; i >= 0; i--) buckets.push(new Date(end.getTime() - i * 3600000));
    return buckets;
}

function dayBuckets(count, now) {
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    const buckets = [];
    for (let i = count - 1; i >= 0; i--) buckets.push(new Date(end.getTime() - i * 86400000));
    return buckets;
}

function hourlyCount(websiteId, date, dailyBaseline) {
    const weight = HOUR_WEIGHTS[date.getHours()];
    const value  = (dailyBaseline / 24) * weight * noiseFor(websiteId, date.toISOString());
    return Math.max(0, Math.round(value));
}

function dailyCount(websiteId, date, dailyBaseline) {
    const isWeekend     = date.getDay() === 0 || date.getDay() === 6;
    const weekendFactor = isWeekend ? 0.75 : 1;
    const value = dailyBaseline * weekendFactor * noiseFor(websiteId, date.toISOString());
    return Math.max(0, Math.round(value));
}

async function getHistory(websiteId, range) {
    const { rows } = await getDb().execute({
        sql:  `SELECT payment, discount, is_live FROM websites WHERE id = ?`,
        args: [websiteId]
    });
    const site = rows[0];
    if (!site || !Number(site.is_live)) return [];

    const monthlyValue  = Math.max(0, Number(site.payment ?? 0) - Number(site.discount ?? 0));
    const dailyBaseline = BASE_DAILY_REQUESTS + monthlyValue * REQUESTS_PER_EURO;
    const now = new Date();

    if (range === '24h') {
        return hourBuckets(24, now).map(date => ({
            t: date.toISOString(),
            count: hourlyCount(websiteId, date, dailyBaseline)
        }));
    }

    const days = range === '30d' ? 30 : 7;
    return dayBuckets(days, now).map(date => ({
        t: date.toISOString(),
        count: dailyCount(websiteId, date, dailyBaseline)
    }));
}

module.exports = { getHistory };