/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 11/12/2025
**/

const express = require('express');
const metricsService = require('../../services/metrics/metricsService');
const logger = require('../../../utils/logger');
const router = express.Router();


router.get('/visitors/:domain', async (req, res) => {
    try {
        const { domain } = req.params;

        logger.info(`Fetching visitor count for: ${domain}`);

        const visitorCount = await metricsService.getVisitorCount(domain);
        
        res.status(200).json({
            success: true,
            domain: domain,
            visitors: visitorCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error for ${req.params.domain}: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message,
            domain: req.params.domain,
            visitors: 0
        });
    }
});

module.exports = router;