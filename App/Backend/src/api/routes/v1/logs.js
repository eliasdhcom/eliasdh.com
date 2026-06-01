/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/05/2026
**/

const express     = require('express');
const { jwtAuth } = require('../../../middleware/jwtAuth');
const logsService = require('../../services/logs/logsService');

const router = express.Router();

router.use(jwtAuth);

router.get('/', async (req, res, next) => {
    try {
        if ((req.user?.role ?? '').toLowerCase() !== 'admin') {
            return res.status(403).json({ success: false, error: 'Geen toegang.' });
        }
        const { action, userId, search, dateFrom, dateTo, limit, offset } = req.query;
        const result = await logsService.getLogs({ action, userId, search, dateFrom, dateTo, limit, offset });
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
});

module.exports = router;