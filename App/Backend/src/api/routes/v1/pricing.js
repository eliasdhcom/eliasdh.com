/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const express        = require('express');
const { body, param, validationResult } = require('express-validator');
const pricingService = require('../../services/pricing/pricingService');
const { jwtAuth }    = require('../../../middleware/jwtAuth');
const logger         = require('../../../utils/logger');
const router         = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const plans = await pricingService.getAll();
        res.json({ success: true, data: plans });
    } catch (err) {
        logger.error(`Error fetching pricing plans: ${err.message}`);
        next(err);
    }
});

router.post('/',
    jwtAuth,
    body('name').notEmpty().isString().trim(),
    body('monthlyPrice').isNumeric(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const plan = await pricingService.create(req.body);
            res.status(201).json({ success: true, data: plan });
        } catch (err) {
            if (err.message?.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Een plan met deze naam bestaat al.' });
            next(err);
        }
    }
);

router.put('/:id',
    jwtAuth,
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const plan = await pricingService.update(Number(req.params.id), req.body);
            res.json({ success: true, data: plan });
        } catch (err) {
            next(err);
        }
    }
);

router.delete('/:id',
    jwtAuth,
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await pricingService.delete(Number(req.params.id));
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;