/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const express        = require('express');
const { body, param, validationResult } = require('express-validator');
const pricingService = require('../../services/pricing/pricingService');
const logsService    = require('../../services/logs/logsService');
const { jwtAuth }    = require('../../../middleware/jwtAuth');
const logger         = require('../../../utils/logger');
const router         = express.Router();

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

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
    body('color').optional().isString().matches(/^#[0-9a-fA-F]{6}$/),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const plan = await pricingService.create(req.body);
            logsService.addLog({ ...logActor(req), action: 'CREATE', resourceId: plan.id, details: `Pricing plan created: ${plan.name}` });
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
            logsService.addLog({ ...logActor(req), action: 'UPDATE', resourceId: req.params.id, details: `Pricing plan updated: ${plan.name}` });
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
            logsService.addLog({ ...logActor(req), action: 'DELETE', resourceId: req.params.id, details: 'Pricing plan deleted' });
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;