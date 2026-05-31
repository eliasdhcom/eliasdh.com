/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 31/05/2026
**/

const express      = require('express');
const { param, validationResult } = require('express-validator');
const costsService = require('../../services/costs/costsService');
const { jwtAuth }  = require('../../../middleware/jwtAuth');
const logger       = require('../../../utils/logger');
const router       = express.Router();

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
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;