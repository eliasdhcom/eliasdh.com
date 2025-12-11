/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const customersRoutes = require('./customers');
const metricsRoutes = require('./metrics');

const router = express.Router();

router.use('/customers', customersRoutes);
router.use('/metrics', metricsRoutes);

module.exports = router;