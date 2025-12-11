/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const customersRoutes = require('./customers');

const router = express.Router();

router.use('/customers', customersRoutes);

module.exports = router;