/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const routes = require('../api/routes');
const errorHandler = require('../middleware/errorHandler');
const { apiKeyAuth } = require('../middleware/auth');
const { server: config } = require('./env');
const logger = require('../utils/logger');
const clusterService = require('../api/services/cluster/clusterService');
const { getDb, initSchema } = require('../database/db');
const bcrypt = require('bcryptjs');
const app = express();

app.set('trust proxy', 1);

const corsOptions = {
    origin: ['http://localhost:4200', 'https://eliasdh.com', 'https://www.eliasdh.com'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['X-API-Key', 'Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: { message: 'Too many requests, please try again later' } },
});

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: { message: 'Too many contact requests, please try again later' } },
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

const PUBLIC_PATHS = ['/api/v1/contact', '/api/v1/auth', '/api/v1/users'];

app.use((req, res, next) => {
    if (PUBLIC_PATHS.some(p => req.path.startsWith(p))) return next();
    apiKeyAuth(req, res, next);
});

app.use('/api/v1/contact', contactLimiter);

app.use('/api', routes);
app.use(errorHandler);

async function initAdminUser() {
    const email    = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
        logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin user init.');
        return;
    }
    const { rows: [{ n }] } = await getDb().execute('SELECT COUNT(*) AS n FROM users');
    if (Number(n) > 0) return;
    const hash = await bcrypt.hash(password, 12);
    await getDb().execute({
        sql:  `INSERT INTO users (email, password_hash, first_name, last_name, role, company) VALUES (?, ?, ?, ?, 'Admin', ?)`,
        args: [
            email, hash,
            process.env.ADMIN_FIRST_NAME ?? '',
            process.env.ADMIN_LAST_NAME  ?? '',
            process.env.ADMIN_COMPANY    ?? ''
        ]
    });
    logger.info(`Admin user created: ${email}`);
}

async function initHQCustomer() {
    const configPath = require('path').join(__dirname, '../../hq.json');
    if (!require('fs').existsSync(configPath)) {
        logger.info('hq.json not found — skipping HQ customer init.');
        return;
    }
    const hq = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
    if (!hq.name) return;

    const db = getDb();
    const { rows: [{ n }] } = await db.execute('SELECT COUNT(*) AS n FROM customers WHERE is_hq = 1');
    if (Number(n) > 0) return;

    const id = hq.id ?? '000';
    await db.execute({
        sql:  `INSERT INTO customers (id, name, is_hq, first_name, last_name, email, phone, mobile)
               VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
        args: [id, hq.name, hq.firstName ?? '', hq.lastName ?? '', hq.email ?? '', hq.phone ?? '', hq.phone ?? '']
    });

    const loc = hq.location;
    if (loc) {
        const locRes = await db.execute({
            sql:  `INSERT INTO customer_locations
                       (customer_id, street, number, postal_code, city, country, vat, latitude, longitude)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, loc.street ?? '', loc.number ?? '', loc.postal ?? '', loc.city ?? '',
                   loc.country || 'Belgium', loc.vat ?? null, loc.lat ?? null, loc.lng ?? null]
        });
        const locId = Number(locRes.lastInsertRowid);
        for (const s of (loc.socials ?? [])) {
            if (s.url) await db.execute({
                sql:  'INSERT INTO location_social_links (location_id, type, url) VALUES (?, ?, ?)',
                args: [locId, s.type, s.url]
            });
        }
    }

    for (const w of (hq.websites ?? [])) {
        if (!w.url) continue;
        await db.execute({
            sql:  `INSERT OR IGNORE INTO websites
                       (id, customer_id, name, url, subscription_type, is_live, start_date, frequency, payment, discount)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                w.id ?? id, id,
                w.name             ?? hq.name,
                w.url,
                w.subscriptionType ?? 'Free',
                w.isLive           ? 1 : 0,
                w.startDate        ?? null,
                w.frequency        ?? 'yearly',
                Number(w.payment   ?? 0),
                Number(w.discount  ?? 0)
            ]
        });
    }

    for (const d of (hq.domains ?? [])) {
        if (!d.name) continue;
        await db.execute({
            sql:  `INSERT INTO domain_names (customer_id, name, renewal_date, annual_price) VALUES (?, ?, ?, ?)`,
            args: [id, d.name, d.renewalDate ?? '', Number(d.annualPrice ?? 0)]
        });
    }

    logger.info(`HQ customer created: ${hq.name} (${id})`);
}

async function runSeed() {
    try {
        const { seedFn } = require('../database/seed');
        logger.info('Running seed (development only)…');
        await seedFn();
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            logger.info('Seed file not present — skipping (production).');
        } else {
            throw err;
        }
    }
}

const startServer = async () => {
    await initSchema();
    await initAdminUser();
    await initHQCustomer();
    if (process.env.NODE_ENV !== 'production') {
        await runSeed();
    }

    app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} (HTTP)`);
        logger.info(process.env.NODE_ENV === 'production' ? 'Production mode!' : 'Development mode!');

        clusterService.startNodeMonitoring();
    });
};

module.exports = { startServer };