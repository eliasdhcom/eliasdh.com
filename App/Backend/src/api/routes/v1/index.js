/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const icarusRoutes = require('./icarus');

const router = express.Router();

router.use('/icarus', icarusRoutes);

module.exports = router;