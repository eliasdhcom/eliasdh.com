/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const customersRoutes = require('./customers');
const metricsRoutes = require('./metrics');
const contactRoutes = require('./contact');
const clusterRoutes = require('./cluster');

const router = express.Router();

router.use('/customers', customersRoutes);
router.use('/metrics', metricsRoutes);
router.use('/contact', contactRoutes);
router.use('/cluster', clusterRoutes);

module.exports = router;