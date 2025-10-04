/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const icarusService = require('../../services/icarus/icarusService');
const logger = require('../../../utils/logger');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            logger.warn('Invalid message format');
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }

        const result = await icarusService.generateReply(message);
        res.status(200).json({ data: result });
    } catch (error) {
        logger.error(`Icarus route error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;