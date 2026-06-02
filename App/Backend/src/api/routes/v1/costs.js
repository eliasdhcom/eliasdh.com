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

const FREQ_LABELS = { monthly: 'maandelijks', quarterly: 'kwartaal', yearly: 'jaarlijks' };
const TYPE_LABELS = { fixed: 'vast', variable: 'variabel' };

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
        const freq = FREQ_LABELS[cost.frequency] ?? cost.frequency;
        const type = TYPE_LABELS[cost.type]      ?? cost.type;
        logsService.addLog({
            ...logActor(req),
            action:     'CREATE',
            resource:   'cost',
            resourceId: cost.id,
            details:    `Kost aangemaakt: "${cost.name}" — €${cost.amount}, ${freq}, ${type}`
        });
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

            const id  = Number(req.params.id);
            const old = await costsService.getById(id);
            const updated = await costsService.update(id, req.body);

            const changes = [];
            if (old && old.name      !== updated.name)      changes.push(`naam: "${old.name}" → "${updated.name}"`);
            if (old && old.amount    !== updated.amount)    changes.push(`bedrag: €${old.amount} → €${updated.amount}`);
            if (old && old.frequency !== updated.frequency) changes.push(`frequentie: ${FREQ_LABELS[old.frequency] ?? old.frequency} → ${FREQ_LABELS[updated.frequency] ?? updated.frequency}`);
            if (old && old.type      !== updated.type)      changes.push(`type: ${TYPE_LABELS[old.type] ?? old.type} → ${TYPE_LABELS[updated.type] ?? updated.type}`);

            const details = changes.length
                ? `Kost bijgewerkt: "${updated.name}" | ${changes.join(', ')}`
                : `Kost bijgewerkt: "${updated.name}"`;

            logsService.addLog({
                ...logActor(req),
                action:     'UPDATE',
                resource:   'cost',
                resourceId: id,
                details
            });
            res.json({ success: true, data: updated });
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

            const id   = Number(req.params.id);
            const cost = await costsService.getById(id);
            await costsService.delete(id);

            logsService.addLog({
                ...logActor(req),
                action:     'DELETE',
                resource:   'cost',
                resourceId: id,
                details:    cost
                    ? `Kost verwijderd: "${cost.name}" (${FREQ_LABELS[cost.frequency] ?? cost.frequency}, ${TYPE_LABELS[cost.type] ?? cost.type}, €${cost.amount})`
                    : `Kost verwijderd (ID: ${id})`
            });
            res.json({ success: true });
        } catch (err) { next(err); }
    }
);

module.exports = router;
