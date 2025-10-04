/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

const express = require('express');
const v1Router = require('./v1');

const router = express.Router();

router.use('/v1', v1Router);

module.exports = router;