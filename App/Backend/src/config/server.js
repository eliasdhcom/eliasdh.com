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