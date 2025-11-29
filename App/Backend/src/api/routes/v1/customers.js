/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/11/2025
**/

const express = require('express');
const customerService = require('../../services/customers/customersService');
const logger = require('../../../utils/logger');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        logger.info('Fetching all customers');
        const customers = await customerService.getAllCustomers();
        res.status(200).json({
            success: true,
            data: customers,
            count: customers.length
        });
    } catch (error) {
        logger.error(`Error fetching customers: ${error.message}`);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        logger.info(`Fetching customer with ID: ${id}`);
        const customer = await customerService.getCustomerById(id);
        res.status(200).json({
            success: true,
            data: customer
        });
    } catch (error) {
        logger.error(`Error fetching customer: ${error.message}`);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
