/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 04/06/2026
**/

const express     = require('express');
const { body, validationResult } = require('express-validator');
const { jwtAuth } = require('../../../middleware/jwtAuth');
const pushService = require('../../services/push/pushService');
const router      = express.Router();

router.get('/vapid-public-key', (req, res) => {
    res.json({ success: true, key: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe',
    jwtAuth,
    body('endpoint').notEmpty().isString(),
    body('keys.p256dh').notEmpty().isString(),
    body('keys.auth').notEmpty().isString(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await pushService.saveSubscription(req.user.id, req.body);
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

router.delete('/subscribe',
    jwtAuth,
    body('endpoint').notEmpty().isString(),
    async (req, res, next) => {
        try {
            await pushService.removeSubscription(req.body.endpoint);
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;
