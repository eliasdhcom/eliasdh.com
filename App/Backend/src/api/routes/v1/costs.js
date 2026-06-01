/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const express      = require('express');
const { param, validationResult } = require('express-validator');
const costsService = require('../../services/costs/costsService');
const logsService  = require('../../services/logs/logsService');
const { jwtAuth }  = require('../../../middleware/jwtAuth');
const logger       = require('../../../utils/logger');
const router       = express.Router();

const logActor = req => ({
    userId:    req.user?.id,
    userEmail: req.user?.email,
    userName:  `${req.user?.firstName ?? ''} ${req.user?.lastName ?? ''}`.trim(),
    ipAddress: req.ip
});

router.get('/', async (req, res, next) => {
    try {
        const costs = await costsService.getAll();
        res.json({ success: true, data: costs });
    } catch (err) {
        logger.error(`Error fetching costs: ${err.message}`);
        next(err);
    }
});

router.post('/', jwtAuth, async (req, res, next) => {
    try {
        const cost = await costsService.create(req.body);
        logsService.addLog({ ...logActor(req), action: 'CREATE', resourceId: cost.id, details: `Cost created: ${cost.name} (${cost.type})` });
        res.status(201).json({ success: true, data: cost });
    } catch (err) { next(err); }
});

router.put('/:id',
    jwtAuth,
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            const cost = await costsService.update(Number(req.params.id), req.body);
            logsService.addLog({ ...logActor(req), action: 'UPDATE', resourceId: req.params.id, details: `Cost updated: ${cost.name} (${cost.type})` });
            res.json({ success: true, data: cost });
        } catch (err) { next(err); }
    }
);

router.delete('/:id',
    jwtAuth,
    param('id').isInt(),
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
            await costsService.delete(Number(req.params.id));
            logsService.addLog({ ...logActor(req), action: 'DELETE', resourceId: req.params.id, details: 'Cost deleted' });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;