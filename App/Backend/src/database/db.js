/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const { createClient } = require('@libsql/client');
const path = require('path');
const fs   = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.NODE_ENV === 'production' ? '/app/data/eliasdh.db' : path.join(__dirname, '../../eliasdh.db');

let _client = null;

function getDb() {
    if (_client) return _client;
    _client = createClient({ url: `file:${DB_PATH.replace(/\\/g, '/')}` });
    logger.info(`Database: ${DB_PATH}`);
    return _client;
}

async function initSchema() {
    const db = getDb();
    const stmts = [
        `CREATE TABLE IF NOT EXISTS customers (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            is_hq      INTEGER NOT NULL DEFAULT 0,
            first_name TEXT,
            last_name  TEXT,
            email      TEXT,
            phone      TEXT,
            mobile     TEXT,
            logo       TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS customer_locations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            street      TEXT,
            number      TEXT,
            postal_code TEXT,
            city        TEXT,
            country     TEXT NOT NULL DEFAULT 'Belgium',
            vat         TEXT,
            latitude    REAL,
            longitude   REAL
        )`,
        `CREATE TABLE IF NOT EXISTS location_social_links (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL REFERENCES customer_locations(id) ON DELETE CASCADE,
            type        TEXT NOT NULL,
            url         TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS websites (
            id                TEXT PRIMARY KEY,
            customer_id       TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            name              TEXT NOT NULL,
            url               TEXT NOT NULL,
            subscription_type TEXT NOT NULL DEFAULT 'Free',
            is_live           INTEGER NOT NULL DEFAULT 0,
            start_date        TEXT,
            frequency         TEXT NOT NULL DEFAULT 'monthly',
            payment           REAL NOT NULL DEFAULT 0,
            discount          REAL NOT NULL DEFAULT 0,
            visitors          INTEGER DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS pricing_plans (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            name          TEXT UNIQUE NOT NULL,
            monthly_price REAL NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS blog_posts (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            slug         TEXT UNIQUE NOT NULL,
            title        TEXT NOT NULL,
            excerpt      TEXT,
            content      TEXT NOT NULL,
            author       TEXT,
            published_at TEXT,
            reading_time INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name    TEXT,
            last_name     TEXT,
            role          TEXT NOT NULL DEFAULT 'user',
            company       TEXT,
            phone         TEXT,
            birth_date    TEXT,
            avatar        TEXT,
            active        INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS domain_names (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id  TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
            name         TEXT NOT NULL,
            registrar    TEXT,
            renewal_date TEXT NOT NULL,
            annual_price REAL NOT NULL DEFAULT 0,
            discount     REAL NOT NULL DEFAULT 0,
            auto_renew   INTEGER NOT NULL DEFAULT 1
        )`,
        `CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            email      TEXT NOT NULL,
            code       TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS invoice_status (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id     TEXT NOT NULL,
            subscription_id TEXT NOT NULL,
            period_start    TEXT NOT NULL,
            invoice_type    TEXT NOT NULL DEFAULT 'subscription',
            paid            INTEGER NOT NULL DEFAULT 0,
            paid_at         TEXT,
            UNIQUE(customer_id, subscription_id, period_start, invoice_type)
        )`,
        `CREATE TABLE IF NOT EXISTS analysis_costs (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL DEFAULT '',
            amount     REAL    NOT NULL DEFAULT 0,
            frequency  TEXT    NOT NULL DEFAULT 'yearly',
            type       TEXT    NOT NULL DEFAULT 'fixed',
            sort_order INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE INDEX IF NOT EXISTS idx_customer_locations_customer_id  ON customer_locations(customer_id)`,
        `CREATE INDEX IF NOT EXISTS idx_location_social_links_location_id ON location_social_links(location_id)`,
        `CREATE INDEX IF NOT EXISTS idx_websites_customer_id            ON websites(customer_id)`,
        `CREATE INDEX IF NOT EXISTS idx_domain_names_customer_id        ON domain_names(customer_id)`,
        `CREATE INDEX IF NOT EXISTS idx_invoice_status_lookup           ON invoice_status(customer_id, subscription_id, period_start, invoice_type)`,
        `CREATE INDEX IF NOT EXISTS idx_analysis_costs_sort             ON analysis_costs(sort_order)`,
        `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id   ON password_reset_tokens(user_id)`,
        `CREATE TABLE IF NOT EXISTS logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER,
            user_email  TEXT,
            user_name   TEXT,
            action      TEXT NOT NULL,
            resource    TEXT,
            resource_id TEXT,
            details     TEXT,
            ip_address  TEXT,
            created_at  TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC)`,
        `CREATE INDEX IF NOT EXISTS idx_logs_action     ON logs(action)`,
        `CREATE INDEX IF NOT EXISTS idx_logs_resource   ON logs(resource)`,
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint   TEXT NOT NULL UNIQUE,
            p256dh     TEXT NOT NULL,
            auth       TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )`,
        `CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)`,
    ];

    for (const sql of stmts) {
        await db.execute(sql);
    }

    try { await db.execute(`ALTER TABLE invoice_status ADD COLUMN amount            REAL`); } catch (_) {}
    try { await db.execute(`ALTER TABLE invoice_status ADD COLUMN frequency         TEXT`); } catch (_) {}
    try { await db.execute(`ALTER TABLE invoice_status ADD COLUMN subscription_name TEXT`); } catch (_) {}
    try { await db.execute(`ALTER TABLE invoice_status ADD COLUMN subscription_type TEXT`); } catch (_) {}
    try { await db.execute(`ALTER TABLE invoice_status ADD COLUMN subscription_url  TEXT`); } catch (_) {}
    try {
        await db.execute(`
            UPDATE invoice_status
            SET subscription_name = (SELECT name             FROM websites WHERE websites.id = invoice_status.subscription_id),
                subscription_type = (SELECT subscription_type FROM websites WHERE websites.id = invoice_status.subscription_id),
                subscription_url  = (SELECT url              FROM websites WHERE websites.id = invoice_status.subscription_id)
            WHERE paid = 1 AND subscription_type IS NULL AND invoice_type = 'subscription'
        `);
    } catch (_) {}
    try {
        await db.execute(`
            UPDATE invoice_status
            SET subscription_name = (SELECT name FROM domain_names WHERE 'domain:' || PRINTF('%04d', domain_names.id) = invoice_status.subscription_id),
                subscription_type = 'Domain'
            WHERE paid = 1 AND subscription_type IS NULL AND invoice_type = 'domain'
        `);
    } catch (_) {}
    try {
        await db.execute(`
            UPDATE invoice_status
            SET amount = (
                SELECT ROUND((annual_price + annual_price * 0.21), 2)
                FROM domain_names
                WHERE 'domain:' || PRINTF('%04d', domain_names.id) = invoice_status.subscription_id
            )
            WHERE paid = 1 AND amount IS NULL AND invoice_type = 'domain'
        `);
    } catch (_) {}
    try { await db.execute(`ALTER TABLE pricing_plans  ADD COLUMN color     TEXT NOT NULL DEFAULT '#cccccc'`); } catch (_) {}
    try { await db.execute(`ALTER TABLE logs ADD COLUMN resource TEXT`); } catch (_) {}
    try { await db.execute(`CREATE INDEX IF NOT EXISTS idx_logs_resource ON logs(resource)`); } catch (_) {}
    try { await db.execute(`ALTER TABLE customers ADD COLUMN agreement_signed_at TEXT`); } catch (_) {}
    try { await db.execute(`ALTER TABLE customers ADD COLUMN agreement_signature TEXT`); } catch (_) {}
    try { await db.execute(`ALTER TABLE pricing_plans ADD COLUMN is_bestseller INTEGER NOT NULL DEFAULT 0`); } catch (_) {}
    try { await db.execute(`ALTER TABLE pricing_plans ADD COLUMN description    TEXT    NOT NULL DEFAULT '{}'`); } catch (_) {}
    try { await db.execute(`ALTER TABLE pricing_plans ADD COLUMN bullets        TEXT    NOT NULL DEFAULT '{}'`); } catch (_) {}
    try { await db.execute(`ALTER TABLE users ADD COLUMN net_salary REAL NOT NULL DEFAULT 0`); } catch (_) {}
    try { await db.execute(`ALTER TABLE customers ADD COLUMN show_on_home_page INTEGER NOT NULL DEFAULT 1`); } catch (_) {}
}

module.exports = { getDb, initSchema };