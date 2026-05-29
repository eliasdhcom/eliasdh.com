/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express         = require('express');
const customersRoutes = require('./customers');
const metricsRoutes   = require('./metrics');
const contactRoutes   = require('./contact');
const clusterRoutes   = require('./cluster');
const blogRoutes      = require('./blog');
const authRoutes      = require('./auth');
const invoicesRoutes  = require('./invoices');
const usersRoutes     = require('./users');

const router = express.Router();

router.use('/customers', customersRoutes);
router.use('/metrics',   metricsRoutes);
router.use('/contact',   contactRoutes);
router.use('/cluster',   clusterRoutes);
router.use('/blog',      blogRoutes);
router.use('/auth',      authRoutes);
router.use('/invoices',  invoicesRoutes);
router.use('/users',     usersRoutes);

module.exports = router;