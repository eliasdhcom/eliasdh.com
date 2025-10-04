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
const app = express();

app.set('trust proxy', 1);

const corsOptions = {
    origin: ['http://localhost:4200', 'http://localhost:8080', 'https://eliasdh.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['X-API-Key', 'Content-Type'],
};

app.use(cors(corsOptions));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: 100, // Max 100 verzoeken per IP
    message: { error: { message: 'Too many requests, please try again later' } },
});

app.use(limiter);
app.use(express.json());
app.use(apiKeyAuth);
app.use('/api', routes);
app.use(errorHandler);

const startServer = () => {
    app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} (HTTP)`);
        logger.info(process.env.NODE_ENV === 'production' ? 'Production mode!' : 'Development mode!');
    });
};

module.exports = { startServer };