/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const logger = require('../utils/logger');
const { server: config } = require('../config/env');

const apiKeyAuth = (req, res, next) => {
    const apiKey = req.header('X-API-Key');
    const validApiKey = config.eliasdhAPIKey;

    if (!validApiKey) {
        logger.error('API_KEY is not defined in environment variables');
        const error = new Error('Server configuration error');
        error.status = 500;
        return next(error);
    }

    if (!apiKey || apiKey !== validApiKey) {
        logger.warn(`Unauthorized access attempt to ${req.originalUrl} with API key: ${apiKey || 'none'}`);
        const error = new Error('Invalid or missing API key');
        error.status = 401;
        return next(error);
    }

    logger.info(`Authorized access to ${req.originalUrl} with valid API key`);
    next();
};

module.exports = { apiKeyAuth };