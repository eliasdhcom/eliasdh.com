/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 17/12/2025
**/

const express = require('express');
const contactService = require('../../services/contact/contactService');
const logger = require('../../../utils/logger');
const router = express.Router();

router.post('/', async (req, res, next) => {
    try {
        const result = await contactService.submitContactForm(req.body);
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error in contact route:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit contact form'
        });
    }
});

router.get('/stats', async (req, res, next) => {
    try {
        const stats = await contactService.getContactStats();
        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error in contact stats route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve contact statistics'
        });
    }
});

module.exports = router;