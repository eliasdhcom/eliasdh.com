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
const app = express();

app.set('trust proxy', 1);

const corsOptions = {
    origin: ['http://localhost:4200', 'https://eliasdh.com', 'https://www.eliasdh.com'],
    methods: ['GET', 'POST', 'OPTIONS'],
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
app.use(express.json());

app.use((req, res, next) => {
    if (req.path.startsWith('/api/v1/contact')) {
        return next();
    }
    apiKeyAuth(req, res, next);
});

app.use('/api/v1/contact', contactLimiter);

app.use('/api', routes);
app.use(errorHandler);

const startServer = () => {
    app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} (HTTP)`);
        logger.info(process.env.NODE_ENV === 'production' ? 'Production mode!' : 'Development mode!');

        clusterService.startNodeMonitoring();
    });
};

module.exports = { startServer };