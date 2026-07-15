/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express         = require('express');
const customersRoutes = require('./customers');
const contactRoutes   = require('./contact');
const clusterRoutes   = require('./cluster');
const authRoutes      = require('./auth');
const invoicesRoutes  = require('./invoices');
const usersRoutes     = require('./users');
const pricingRoutes   = require('./pricing');
const costsRoutes     = require('./costs');
const logsRoutes      = require('./logs');
const pushRoutes      = require('./push');
const passwordsRoutes = require('./passwords');
const portalRoutes    = require('./portal');

const router = express.Router();

router.use('/customers', customersRoutes);
router.use('/contact',   contactRoutes);
router.use('/cluster',   clusterRoutes);
router.use('/auth',      authRoutes);
router.use('/invoices',  invoicesRoutes);
router.use('/users',     usersRoutes);
router.use('/pricing',   pricingRoutes);
router.use('/costs',     costsRoutes);
router.use('/logs',      logsRoutes);
router.use('/push',      pushRoutes);
router.use('/passwords', passwordsRoutes);
router.use('/portal',    portalRoutes);

module.exports = router;